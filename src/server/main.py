from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
from io import BytesIO
from PIL import Image
import uvicorn
import logging
import uuid
import os
import cv2
import lime
from lime import lime_image
import matplotlib.pyplot as plt
from skimage.segmentation import mark_boundaries, slic
from skimage import color, measure
import shap
import shutil
import time

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Skin Condition Classifier API with CPU-Friendly XAI")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
os.makedirs("debug_images", exist_ok=True)
os.makedirs("temp_images", exist_ok=True)
os.makedirs("explanation_images", exist_ok=True)

# Mount explanation_images directory
app.mount("/explanation_images", StaticFiles(directory="explanation_images"), name="explanation_images")

# Load the ensemble model
try:
    model = tf.keras.models.load_model("skin_model_checkpoint.keras")
    logger.info("Model loaded successfully")
    class_names = ["Eczema", "Melanoma", "Psoriasis"]
    test_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
    _ = model.predict(test_input)
    logger.info("Model verified with test prediction")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    model = None

# Pydantic models
class PredictionResponse(BaseModel):
    condition: str
    confidence: float
    additional_info: dict = {}

class ExplainImageRequest(BaseModel):
    request_id: str
    image_result: dict

class ExplainImageResponse(BaseModel):
    lime_image_path: str
    occlusion_image_path: str
    shap_image_path: str
    features: list
    request_id: str

def preprocess_image(image_bytes, debug_id=None):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if debug_id:
            debug_path = f"debug_images/{debug_id}_original.jpg"
            cv2.imwrite(debug_path, img)
            logger.info(f"Saved original image to {debug_path}")
        img_resized = cv2.resize(img, (224, 224))
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        if debug_id:
            debug_path = f"debug_images/{debug_id}_preprocessed.jpg"
            cv2.imwrite(debug_path, img_rgb)
            logger.info(f"Saved preprocessed image to {debug_path}")
        img_array = img_rgb.astype(np.float32)
        img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
        img_batch = np.expand_dims(img_array, axis=0)
        logger.info(f"Preprocessed image shape: {img_batch.shape}, dtype: {img_batch.dtype}, range: [{np.min(img_batch)}, {np.max(img_batch)}]")
        return img_batch, img_rgb
    except Exception as e:
        logger.error(f"Image preprocessing error: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Image processing failed: {str(e)}")

def cleanup_old_files(directory, max_age_seconds=3600):
    current_time = time.time()
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            file_age = current_time - os.path.getmtime(file_path)
            if file_age > max_age_seconds:
                try:
                    os.remove(file_path)
                    logger.info(f"Deleted old file: {file_path}")
                except Exception as e:
                    logger.error(f"Error deleting file {file_path}: {str(e)}")

def occlusion_sensitivity(model, image, img_rgb, class_idx, patch_size=24, stride=12):
    """
    Generate occlusion sensitivity map - CPU friendly approach
    Returns: (overlaid image, raw maximum impact value)
    """
    try:
        # Create a copy of the image
        image_batch = np.copy(image)
        image_single = image_batch[0]
        height, width = image_single.shape[0], image_single.shape[1]
        
        # Create empty heatmap
        heatmap = np.zeros((height, width), dtype=np.float32)
        
        # Get baseline prediction (no occlusion)
        baseline_pred = model.predict(image_batch)[0, class_idx]
        logger.info(f"Baseline prediction: {baseline_pred}")
        
        # Use fewer patches for CPU efficiency
        patches_evaluated = 0
        max_patches = 100  # Limit total patches evaluated
        
        # Store impacts for computing overall significance
        impacts = []
        
        # Apply occlusion systematically with black patches for stronger effect
        for y in range(0, height - patch_size + 1, stride):
            for x in range(0, width - patch_size + 1, stride):
                # Create occluded image
                occluded_image = np.copy(image_batch)
                
                # Apply occlusion (black patch)
                occluded_image[0, y:y+patch_size, x:x+patch_size, :] = 0.0  # Black patch
                
                # Get prediction for occluded image
                occluded_pred = model.predict(occluded_image)[0, class_idx]
                
                # Compute impact (difference from baseline)
                impact = baseline_pred - occluded_pred
                impacts.append(impact)
                
                # Update heatmap
                heatmap[y:y+patch_size, x:x+patch_size] += impact
                
                # Count patches evaluated
                patches_evaluated += 1
                if patches_evaluated >= max_patches:
                    logger.info(f"Reached maximum patches: {max_patches}")
                    break
            
            if patches_evaluated >= max_patches:
                break
        
        logger.info(f"Evaluated {patches_evaluated} patches for occlusion map")
        
        # Normalize heatmap for visualization
        heatmap = np.maximum(heatmap, 0)
        if np.max(heatmap) > 0:
            heatmap = heatmap / np.max(heatmap)
        
        # Apply colormap
        heatmap_uint8 = np.uint8(255 * heatmap)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        
        # Convert original image back to regular RGB format for display
        display_img = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        
        # Overlay heatmap on original image
        overlaid = cv2.addWeighted(display_img, 0.7, heatmap_colored, 0.3, 0)
        overlaid = cv2.cvtColor(overlaid, cv2.COLOR_BGR2RGB)
        
        # Compute overall impact as the raw maximum absolute impact
        if impacts:
            max_impact = max(abs(imp) for imp in impacts)
            occlusion_impact = max_impact
            logger.info(f"Raw max impact: {max_impact}")
        else:
            occlusion_impact = 0.0
            logger.info("No impacts computed for occlusion sensitivity")
        
        # Convert to Python float to ensure Pydantic serialization
        occlusion_impact = float(occlusion_impact)
        
        logger.info(f"Computed occlusion impact: {occlusion_impact}")
        
        return overlaid, occlusion_impact
    except Exception as e:
        logger.error(f"Occlusion sensitivity error: {str(e)}")
        error_img = np.zeros((224, 224, 3), dtype=np.uint8)
        cv2.putText(error_img, "Occlusion Error", (30, 112), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        return error_img, 0.0

def generate_shap_image(model, image, class_idx, num_samples=10):
    """
    Generate SHAP explanation image - simplified for CPU usage
    """
    try:
        # Create a simple masker that replaces pixels with their mean value
        masker = shap.maskers.Image("inpaint_telea", image[0].shape)
        
        # Create a function that returns the model prediction for the specified class
        predict_fn = lambda x: model.predict(x)[:, class_idx]
        
        # Create explainer with minimum samples for CPU efficiency
        explainer = shap.Explainer(predict_fn, masker)
        
        # Generate SHAP values (with very small sample size for CPU)
        shap_values = explainer(image, max_evals=num_samples, batch_size=5)
        
        # Get the current figure and close it
        shap.image_plot(shap_values, show=False)
        fig = plt.gcf()
        
        # Save the figure to a BytesIO object
        img_buf = BytesIO()
        fig.savefig(img_buf, format='png')
        plt.close(fig)
        
        # Convert the BytesIO object to a numpy array
        img_buf.seek(0)
        img_arr = np.asarray(bytearray(img_buf.read()), dtype=np.uint8)
        shap_img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        
        return shap_img
    except Exception as e:
        logger.error(f"SHAP explanation error: {str(e)}")
        error_img = np.zeros((224, 224, 3), dtype=np.uint8)
        cv2.putText(error_img, "SHAP Error", (30, 112), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        return error_img

@app.get("/")
def read_root():
    return {"status": "active", "model_loaded": model is not None}

@app.post("/predict/", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    debug_id = str(uuid.uuid4())[:8]
    logger.info(f"Processing prediction request {debug_id} for file {file.filename} ({file.content_type})")
    try:
        contents = await file.read()
        logger.info(f"Read file of size {len(contents)} bytes")
        temp_image_path = f"temp_images/{debug_id}.jpg"
        with open(temp_image_path, "wb") as f:
            f.write(contents)
        logger.info(f"Saved image to {temp_image_path}")
        img_array, _ = preprocess_image(contents, debug_id)
        logger.info(f"Running prediction with model")
        predictions = model.predict(img_array)
        predicted_class_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_index])
        condition = class_names[predicted_class_index]
        all_probs = {class_names[i]: float(predictions[0][i]) for i in range(len(class_names))}
        logger.info(f"All probabilities: {all_probs}")
        logger.info(f"Prediction {debug_id}: {condition} with confidence {confidence:.4f}")
        cleanup_old_files("temp_images")
        cleanup_old_files("explanation_images")
        return PredictionResponse(
            condition=condition,
            confidence=confidence,
            additional_info={
                "request_id": debug_id,
                "filename": file.filename,
                "all_probabilities": all_probs
            }
        )
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/explain-image/", response_model=ExplainImageResponse)
async def explain_image(request: ExplainImageRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    request_id = request.request_id
    temp_image_path = f"temp_images/{request_id}.jpg"
    
    if not os.path.exists(temp_image_path):
        raise HTTPException(status_code=404, detail="Image not found for the given request_id")
    
    logger.info(f"Generating explanation for request {request_id}")
    
    # Initialize output files
    lime_filename = f"{request_id}_lime.jpg"
    lime_path = f"explanation_images/{lime_filename}"
    occlusion_filename = f"{request_id}_occlusion.jpg"
    occlusion_path = f"explanation_images/{occlusion_filename}"
    shap_filename = f"{request_id}_shap.jpg"
    shap_path = f"explanation_images/{shap_filename}"
    
    # Initialize features list
    features = []
    
    try:
        # Read the image
        with open(temp_image_path, "rb") as f:
            contents = f.read()
        
        # Preprocess the image
        img_array, img_rgb = preprocess_image(contents, request_id)
        
        # Get class index
        class_idx = class_names.index(request.image_result["condition"])
        
        # 1. Generate LIME explanation
        try:
            def predict_fn(images):
                processed_images = []
                for img in images:
                    img = img.astype(np.float32)
                    img = tf.keras.applications.efficientnet.preprocess_input(img)
                    processed_images.append(img)
                processed_images = np.array(processed_images)
                return model.predict(processed_images)
            
            explainer = lime_image.LimeImageExplainer()
            explanation = explainer.explain_instance(
                img_rgb,
                predict_fn,
                top_labels=1,
                hide_color=0,
                num_samples=50,
                random_seed=42,
                segmentation_fn=lambda x: slic(x, n_segments=50, compactness=30)
            )
            
            top_label = explanation.top_labels[0]
            temp, mask = explanation.get_image_and_mask(
                top_label,
                positive_only=True,
                num_features=5,
                hide_rest=False
            )
            
            # Create and save the LIME visualization
            lime_viz = mark_boundaries(img_rgb / 255.0, mask)
            plt.figure(figsize=(8, 8))
            plt.imshow(lime_viz)
            plt.axis('off')
            plt.tight_layout()
            plt.savefig(lime_path)
            plt.close()
            logger.info(f"Saved LIME heatmap to {lime_path}")
            
            # Extract features and store raw weights
            local_exp = explanation.local_exp.get(top_label, [])
            for feature_idx, weight in local_exp[:5]:
                raw_weight = float(weight)  # Ensure Python float
                logger.info(f"LIME Region {feature_idx} raw weight: {raw_weight}")
                features.append({
                    "name": f"Region {feature_idx}",
                    "description": f"Image region {feature_idx} contributing to {class_names[top_label]}",
                    "impact": raw_weight
                })
            
        except Exception as e:
            logger.error(f"LIME visualization failed: {str(e)}")
            error_img = np.zeros((224, 224, 3), dtype=np.uint8)
            cv2.putText(error_img, "LIME Error", (30, 112), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.imwrite(lime_path, error_img)
            logger.info(f"Saved LIME error image to {lime_path}")
        
        # 2. Generate Occlusion Sensitivity map
        try:
            occlusion_image, occlusion_impact = occlusion_sensitivity(model, img_array, img_rgb, class_idx, patch_size=28, stride=14)
            plt.figure(figsize=(8, 8))
            plt.imshow(occlusion_image)
            plt.axis('off')
            plt.tight_layout()
            plt.savefig(occlusion_path)
            plt.close()
            logger.info(f"Saved Occlusion Sensitivity map to {occlusion_path}")
            
            # Add feature for occlusion with raw impact
            features.append({
                "name": "Occlusion Analysis",
                "description": "Areas where covering the region most decreases prediction confidence",
                "impact": occlusion_impact
            })
        except Exception as e:
            logger.error(f"Occlusion sensitivity failed: {str(e)}")
            error_img = np.zeros((224, 224, 3), dtype=np.uint8)
            cv2.putText(error_img, "Occlusion Error", (30, 112), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.imwrite(occlusion_path, error_img)
        
        # 3. Generate SHAP explanation
        try:
            shap_image = generate_shap_image(model, img_array, class_idx, num_samples=20)
            cv2.imwrite(shap_path, cv2.cvtColor(shap_image, cv2.COLOR_RGB2BGR))
            logger.info(f"Saved SHAP explanation to {shap_path}")
        except Exception as e:
            logger.error(f"SHAP generation failed: {str(e)}")
            error_img = np.zeros((224, 224, 3), dtype=np.uint8)
            cv2.putText(error_img, "SHAP Error", (30, 112), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.imwrite(shap_path, error_img)
        
        # If no features were generated, add a default one
        if not features:
            features.append({
                "name": "Default Feature",
                "description": "No specific features could be identified",
                "impact": 0.0
            })
        
        cleanup_old_files("explanation_images")
        return ExplainImageResponse(
            lime_image_path=f"explanation_images/{lime_filename}",
            occlusion_image_path=f"explanation_images/{occlusion_filename}",
            shap_image_path=f"explanation_images/{shap_filename}",
            features=features,
            request_id=request_id
        )
    except Exception as e:
        logger.error(f"Explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")

@app.get("/test/")
async def test():
    if model is None:
        return {"status": "error", "message": "Model not loaded"}
    try:
        results = {}
        test_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
        prediction = model.predict(test_input)
        results["test_zeros"] = {
            "predicted_class": class_names[np.argmax(prediction[0])],
            "confidence": float(prediction[0][np.argmax(prediction[0])]),
            "all_probabilities": {class_names[i]: float(prediction[0][i]) for i in range(len(class_names))}
        }
        return {
            "status": "ok",
            "results": results,
            "message": "Model is working and can be called. Check the predictions to verify expected behavior."
        }
    except Exception as e:
        logger.error(f"Test error: {str(e)}")
        return {
            "status": "error",
            "message": f"Error during test: {str(e)}"
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)