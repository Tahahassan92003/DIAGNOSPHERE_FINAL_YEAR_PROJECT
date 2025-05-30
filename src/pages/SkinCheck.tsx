import { useState, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';
import DiagnosisForm from '../components/DiagnosisForm';
import type { NextPage } from 'next';
import Header from '@/components/Header';

// Add jsPDF type extensions
import 'jspdf';
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
    lastAutoTable: any;
  }
}

// API URL for FastAPI backend
const API_URL = 'http://localhost:8000';

interface AnalysisResult {
  condition: string;
  confidence: number;
  additional_info: {
    all_probabilities: { [key: string]: number };
    request_id?: string; // Added
    filename?: string; // Added
  };
}

interface FormData {
  duration: string;
  onset: string;
  itchLevel: number;
  painLevel: number;
  burningLevel: number;
  movementDiscomfort: number;
  hasRedness: boolean;
  hasSwelling: boolean;
  hasBlisters: boolean;
  isScaly: boolean;
  skinColor: string;
  borderType: string;
  isSymmetrical: string;
  surfaceTexture: string[];
  approximateSize: string;
  hasSizeChanged: string;
  hasAppearanceChanged: string;
  isDry: boolean;
  isThickened: boolean;
  isWarm: boolean;
  isCracked: boolean;
  knownTriggers: string[];
  environmentFactors: string[];
  recentIllness: string;
  hasSpread: string;
  affectedAreas: string[];
  personalHistory: string[];
  familyHistory: string[];
  sunExposure: string;
  recentSunburn: string;
  useSunscreen: string;
  chemicalExposure: string;
  smokingStatus: string;
  hasNailSymptoms: boolean;
  hasJointPain: boolean;
  previousTreatments: string[];
  treatmentEffects: string;
  additionalInfo: string;
}

// After the interface FormData, add a new interface for disease complications
interface DiseaseComplications {
  [key: string]: {
    relatedConditions: string[];
    description: string;
  }
}

const diseaseProfiles = {
  eczema: {
    duration: ['1-4weeks', '1-3months', '3-6months', 'moreThan6months'],
    onset: ['gradual'],
    itchLevel: { min: 6, max: 10 },
    painLevel: { min: 0, max: 5 },
    burningLevel: { min: 2, max: 7 },
    movementDiscomfort: { min: 0, max: 5 },
    hasRedness: true,
    hasSwelling: true,
    hasBlisters: false,
    isScaly: true,
    skinColor: ['red', 'pink'],
    borderType: ['diffuse', 'irregular'],
    isSymmetrical: ['often'],
    surfaceTexture: ['rough', 'dry', 'flaky'],
    hasSizeChanged: ['yes-bigger', 'fluctuates'],
    hasAppearanceChanged: ['yes-worse', 'fluctuates'],
    isDry: true,
    isThickened: true,
    isWarm: true,
    isCracked: true,
    knownTriggers: ['stress', 'allergens', 'irritants', 'weather'],
    environmentFactors: ['cold', 'dry', 'indoor-heating'],
    hasSpread: ['slightly', 'significantly'],
    affectedAreas: ['elbow-creases', 'knee-creases', 'hands', 'face', 'neck'],
    personalHistory: ['allergies', 'asthma', 'hayfever', 'eczema'],
    familyHistory: ['eczema', 'allergies', 'asthma'],
    sunExposure: ['sometimes-improves', 'no-effect'],
    hasNailSymptoms: false,
    hasJointPain: false,
    commonTreatments: ['moisturizers', 'topicalSteroids', 'antihistamines']
  },
  psoriasis: {
    duration: ['1-3months', '3-6months', 'moreThan6months'],
    onset: ['gradual'],
    itchLevel: { min: 4, max: 8 },
    painLevel: { min: 2, max: 6 },
    burningLevel: { min: 1, max: 5 },
    movementDiscomfort: { min: 2, max: 8 },
    hasRedness: true,
    hasSwelling: false,
    hasBlisters: false,
    isScaly: true,
    skinColor: ['red', 'silver-scale'],
    borderType: ['well-defined', 'clear'],
    isSymmetrical: ['often'],
    surfaceTexture: ['thick', 'silver-scale', 'raised'],
    hasSizeChanged: ['yes-bigger', 'stable'],
    hasAppearanceChanged: ['stable', 'cycles'],
    isDry: true,
    isThickened: true,
    isWarm: true,
    isCracked: true,
    knownTriggers: ['stress', 'injury', 'infection', 'medication'],
    environmentFactors: ['cold', 'dry'],
    hasSpread: ['slightly', 'significantly'],
    affectedAreas: ['scalp', 'elbows', 'knees', 'lower-back', 'nails'],
    personalHistory: ['psoriasis', 'autoimmune'],
    familyHistory: ['psoriasis', 'autoimmune'],
    sunExposure: ['improves', 'sometimes-improves'],
    hasNailSymptoms: true,
    hasJointPain: true,
    commonTreatments: ['topicalSteroids', 'lightTherapy', 'oralMedication']
  },
  melanoma: {
    duration: ['1-4weeks', '1-3months', '3-6months', 'moreThan6months'],
    onset: ['new-or-changed'],
    itchLevel: { min: 0, max: 4 },
    painLevel: { min: 0, max: 3 },
    burningLevel: { min: 0, max: 2 },
    movementDiscomfort: { min: 0, max: 1 },
    hasRedness: true,
    hasSwelling: false,
    hasBlisters: false,
    isScaly: false,
    skinColor: ['brown', 'black', 'multi-colored', 'blue', 'red', 'white'],
    borderType: ['irregular', 'uneven', 'notched'],
    isSymmetrical: ['no'],
    surfaceTexture: ['uneven', 'raised', 'firm'],
    hasSizeChanged: ['yes-bigger'],
    hasAppearanceChanged: ['yes-worse', 'changed-color'],
    isDry: false,
    isThickened: false,
    isWarm: false,
    isCracked: false,
    knownTriggers: ['sun-exposure', 'sunburn-history', 'uv-exposure'],
    environmentFactors: [],
    hasSpread: ['no', 'slightly'],
    affectedAreas: ['sun-exposed-areas', 'back', 'legs', 'face'],
    personalHistory: ['skin-cancer', 'excessive-sun', 'many-moles'],
    familyHistory: ['melanoma', 'skin-cancer'],
    sunExposure: ['high', 'moderate'],
    recentSunburn: ['yes', 'multiple'],
    useSunscreen: ['never', 'rarely'],
    hasNailSymptoms: false,
    hasJointPain: false,
    commonTreatments: []
  }
};

// After diseaseProfiles, add the complications data
const diseaseComplications: DiseaseComplications = {
  melanoma: {
    relatedConditions: [
      "Metastatic cancer (spread to other organs)",
      "Lymphatic system involvement",
      "Recurrent melanoma",
      "Treatment-related complications"
    ],
    description: "Melanoma is a serious form of skin cancer that can spread to other parts of the body if not detected and treated early. It's important to monitor for any changes and follow up with regular skin checks and medical evaluations."
  },
  eczema: {
    relatedConditions: [
      "Secondary skin infections",
      "Asthma exacerbation",
      "Sleep disturbances",
      "Psychological stress"
    ],
    description: "Eczema (atopic dermatitis) is often linked to other allergic conditions like asthma and hay fever. Managing eczema effectively can help reduce the risk of complications and improve quality of life."
  },
  psoriasis: {
    relatedConditions: [
      "Psoriatic arthritis",
      "Cardiovascular disease",
      "Metabolic syndrome",
      "Inflammatory bowel disease",
      "Depression and anxiety"
    ],
    description: "Psoriasis is a systemic inflammatory condition that affects more than just the skin. People with psoriasis have a higher risk of developing several other health conditions, particularly joint inflammation (psoriatic arthritis)."
  }
};

function calculateDiseaseMatch(formData: FormData): { [key: string]: number } {
  const results: { [key: string]: number } = {};
  
  Object.entries(diseaseProfiles).forEach(([disease, profile]) => {
    let totalPoints = 0;
    let matchPoints = 0;
    
    if (profile.duration.includes(formData.duration)) matchPoints += 1;
    totalPoints += 1;
    
    if (profile.onset.includes(formData.onset)) matchPoints += 1;
    totalPoints += 1;
    
    if (formData.itchLevel >= profile.itchLevel.min && formData.itchLevel <= profile.itchLevel.max) matchPoints += 1;
    totalPoints += 1;
    
    if (formData.painLevel >= profile.painLevel.min && formData.painLevel <= profile.painLevel.max) matchPoints += 1;
    totalPoints += 1;
    
    if (formData.burningLevel >= profile.burningLevel?.min && formData.burningLevel <= profile.burningLevel?.max) matchPoints += 0.5;
    totalPoints += 0.5;
    
    if (formData.movementDiscomfort >= profile.movementDiscomfort?.min && 
        formData.movementDiscomfort <= profile.movementDiscomfort?.max) matchPoints += 0.5;
    totalPoints += 0.5;
    
    if (formData.hasRedness === profile.hasRedness) matchPoints += 0.5;
    if (formData.hasSwelling === profile.hasSwelling) matchPoints += 0.5;
    if (formData.hasBlisters === profile.hasBlisters) matchPoints += 0.5;
    if (formData.isScaly === profile.isScaly) matchPoints += 0.5;
    totalPoints += 2;
    
    if (profile.skinColor?.includes(formData.skinColor)) matchPoints += 1;
    totalPoints += 1;
    
    if (profile.borderType?.includes(formData.borderType)) matchPoints += 1;
    totalPoints += 1;
    
    if (profile.isSymmetrical?.includes(formData.isSymmetrical)) matchPoints += 0.5;
    totalPoints += 0.5;
    
    let textureMatches = 0;
    if (formData.surfaceTexture && profile.surfaceTexture) {
      formData.surfaceTexture.forEach(texture => {
        if (profile.surfaceTexture.includes(texture)) textureMatches++;
      });
      if (textureMatches > 0) matchPoints += Math.min(1, textureMatches / profile.surfaceTexture.length);
    }
    totalPoints += 1;
    
    if (profile.hasSizeChanged?.includes(formData.hasSizeChanged)) matchPoints += 0.5;
    totalPoints += 0.5;
    
    if (profile.hasAppearanceChanged?.includes(formData.hasAppearanceChanged)) matchPoints += 0.5;
    totalPoints += 0.5;
    
    if (formData.isDry === profile.isDry) matchPoints += 0.25;
    if (formData.isThickened === profile.isThickened) matchPoints += 0.25;
    if (formData.isWarm === profile.isWarm) matchPoints += 0.25;
    if (formData.isCracked === profile.isCracked) matchPoints += 0.25;
    totalPoints += 1;
    
    let triggerMatches = 0;
    if (formData.knownTriggers && profile.knownTriggers) {
      formData.knownTriggers.forEach(trigger => {
        if (profile.knownTriggers.includes(trigger)) triggerMatches++;
      });
      if (triggerMatches > 0 && profile.knownTriggers.length > 0) matchPoints += Math.min(1, triggerMatches / profile.knownTriggers.length);
    }
    totalPoints += 1;
    
    let envFactorMatches = 0;
    if (formData.environmentFactors && profile.environmentFactors) {
      formData.environmentFactors.forEach(factor => {
        if (profile.environmentFactors.includes(factor)) envFactorMatches++;
      });
      if (envFactorMatches > 0 && profile.environmentFactors.length > 0) matchPoints += Math.min(0.5, envFactorMatches / profile.environmentFactors.length);
    }
    totalPoints += 0.5;
    
    if (profile.hasSpread.includes(formData.hasSpread)) matchPoints += 1;
    totalPoints += 1;
    
    let areaMatches = 0;
    if (formData.affectedAreas && profile.affectedAreas) {
      formData.affectedAreas.forEach(area => {
        if (profile.affectedAreas.includes(area)) areaMatches++;
      });
      if (areaMatches > 0) matchPoints += Math.min(1, areaMatches / profile.affectedAreas.length);
    }
    totalPoints += 1;
    
    let personalHistoryMatches = 0;
    if (formData.personalHistory && profile.personalHistory) {
      formData.personalHistory.forEach(condition => {
        if (profile.personalHistory.includes(condition)) personalHistoryMatches++;
      });
      if (personalHistoryMatches > 0) matchPoints += Math.min(0.5, personalHistoryMatches / profile.personalHistory.length);
    }
    totalPoints += 0.5;
    
    let familyHistoryMatches = 0;
    if (formData.familyHistory && profile.familyHistory) {
      formData.familyHistory.forEach(condition => {
        if (profile.familyHistory.includes(condition)) familyHistoryMatches++;
      });
      if (familyHistoryMatches > 0) matchPoints += Math.min(0.5, familyHistoryMatches / profile.familyHistory.length);
    }
    totalPoints += 0.5;
    
    if (profile.sunExposure?.includes(formData.sunExposure)) matchPoints += 0.5;
    totalPoints += 0.5;
    
    if (formData.hasNailSymptoms === profile.hasNailSymptoms) matchPoints += 0.5;
    if (formData.hasJointPain === profile.hasJointPain) matchPoints += 0.5;
    totalPoints += 1;
    
    let treatmentMatchCount = 0;
    if (profile.commonTreatments && profile.commonTreatments.length > 0) {
      profile.commonTreatments.forEach(treatment => {
        if (formData.previousTreatments.includes(treatment)) treatmentMatchCount++;
      });
      matchPoints += Math.min(1, treatmentMatchCount / profile.commonTreatments.length);
      totalPoints += 1;
    }
    
    results[disease] = Math.round((matchPoints / totalPoints) * 100);
  });
  
  return results;
}

// Updated function to calculate combined prediction
function calculateCombinedPrediction(
  imageResult: AnalysisResult,
  symptomResults: { [key: string]: number }
): AnalysisResult {
  const imageWeight = 0.7; // Image analysis weight
  const symptomWeight = 0.3; // Symptom analysis weight
  
  // Normalize symptom results to probabilities (0 to 1)
  const symptomProbs: { [key: string]: number } = {};
  let symptomSum = 0;
  Object.values(symptomResults).forEach(value => symptomSum += value);
  Object.entries(symptomResults).forEach(([disease, percentage]) => {
    // Convert disease name to lowercase to ensure consistent keys
    const diseaseLower = disease.toLowerCase();
    symptomProbs[diseaseLower] = symptomSum > 0 ? percentage / symptomSum : 0;
  });
  
  // Normalize image results to ensure consistent keys
  const normalizedImageProbs: { [key: string]: number } = {};
  Object.entries(imageResult.additional_info.all_probabilities).forEach(([disease, prob]) => {
    const diseaseLower = disease.toLowerCase();
    normalizedImageProbs[diseaseLower] = prob;
  });
  
  // Combine probabilities using normalized keys
  const combinedProbs: { [key: string]: number } = {};
  const allConditions = new Set([
    ...Object.keys(normalizedImageProbs),
    ...Object.keys(symptomProbs)
  ]);
  
  allConditions.forEach(condition => {
    const imageProb = normalizedImageProbs[condition] || 0;
    const symptomProb = symptomProbs[condition] || 0;
    combinedProbs[condition] = (imageProb * imageWeight) + (symptomProb * symptomWeight);
  });
  
  // Find condition with highest combined probability
  let maxProb = 0;
  let topCondition = '';
  Object.entries(combinedProbs).forEach(([condition, prob]) => {
    if (prob > maxProb) {
      maxProb = prob;
      topCondition = condition;
    }
  });
  
  return {
    condition: topCondition.charAt(0).toUpperCase() + topCondition.slice(1), // Capitalize first letter
    confidence: maxProb,
    additional_info: {
      all_probabilities: combinedProbs
    }
  };
}

const getDurationText = (duration: string): string => {
  const durationMap: { [key: string]: string } = {
    'lessThanWeek': 'Less than a week',
    '1-4weeks': '1-4 weeks',
    '1-3months': '1-3 months',
    '3-6months': '3-6 months',
    'moreThan6months': 'More than 6 months'
  };
  return durationMap[duration] || duration;
};

const getOnsetText = (onset: string): string => {
  const onsetMap: { [key: string]: string } = {
    'sudden': 'Sudden onset',
    'gradual': 'Gradual development',
    'cyclical': 'Cyclical/recurring pattern',
    'new-or-changed': 'New or changed from existing lesion'
  };
  return onsetMap[onset] || onset;
};

const getSpreadText = (spread: string): string => {
  const spreadMap: { [key: string]: string } = {
    'no': 'No spreading',
    'slightly': 'Slight spreading',
    'significantly': 'Significant spreading',
    'fluctuates': 'Fluctuates over time'
  };
  return spreadMap[spread] || spread;
};

const SkinAnalysisPage: NextPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [imageResult, setImageResult] = useState<AnalysisResult | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState<'upload' | 'form' | 'results'>('upload');
  const [symptomResult, setSymptomResult] = useState<AnalysisResult | null>(null);
  const [combinedResult, setCombinedResult] = useState<AnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedImageId, setSavedImageId] = useState<string | null>(null);

  // Check for saved results when component mounts
  useEffect(() => {
    // Check if we should restore results (when coming back from explain-predictions)
    const queryParams = new URLSearchParams(window.location.search);
    const showResults = queryParams.get('showResults');
    const hasResults = localStorage.getItem('diagnosphere_hasResults');
    
    if (showResults === 'true' && hasResults === 'true') {
      try {
        // Restore data from localStorage
        const storedImageResult = localStorage.getItem('diagnosphere_imageResult');
        const storedFormData = localStorage.getItem('diagnosphere_formData');
        const storedSymptomResult = localStorage.getItem('diagnosphere_symptomResult');
        const storedCombinedResult = localStorage.getItem('diagnosphere_combinedResult');
        const storedRequestId = localStorage.getItem('diagnosphere_requestId');
        
        if (storedImageResult) setImageResult(JSON.parse(storedImageResult));
        if (storedFormData) setFormData(JSON.parse(storedFormData));
        if (storedSymptomResult) setSymptomResult(JSON.parse(storedSymptomResult));
        if (storedCombinedResult) setCombinedResult(JSON.parse(storedCombinedResult));
        if (storedRequestId) setSavedImageId(storedRequestId);
        
        // Set the analysis stage to results
        setAnalysisStage('results');
        
        // Clean URL by removing the query parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } catch (error) {
        console.error('Error restoring results:', error);
      }
    }
  }, []);

  const handleImageSelected = async (file: File, imageId?: string) => {
    try {
      setError(null);
      setSelectedFile(file);
      if (imageId) setSavedImageId(imageId);
      
      // Immediately transition to form stage without waiting for analysis
      setAnalysisStage('form');
      
      // Start background analysis
      setIsAnalyzing(true);
      console.log("Starting image analysis in background...");
      
      const uniqueFileName = `${Date.now()}-${file.name}`;
      const uniqueFile = new File([file], uniqueFileName, { type: file.type });
      
      const formData = new FormData();
      formData.append('file', uniqueFile);
      
      console.log("Sending request to API:", `${API_URL}/predict/?nocache=${Date.now()}`);
      
      const response = await fetch(`${API_URL}/predict/?nocache=${Date.now()}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze image');
      }
      
      const data = await response.json();
      console.log("Received API response:", data);
      
      // Ensure we have valid image analysis data
      if (!data || !data.condition) {
        throw new Error('Invalid response from image analysis API');
      }
      
      // Update state with the image analysis results
      setImageResult(data);
      
      // Log success and ensure we're not in analyzing state anymore
      console.log("Analysis complete, prediction:", data.condition);
      
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image. Please try again.');
      // Don't change the stage back to upload if an error occurs, let user continue with form
    } finally {
      // Ensure analyzing state is set to false no matter what
      setIsAnalyzing(false);
      console.log("Analysis process completed, isAnalyzing set to false");
    }
  };
  
  const handleFormSubmit = (data: FormData) => {
    setFormData(data);
    
    // Calculate symptom-based prediction
    const matchResults = calculateDiseaseMatch(data);
    const symptomProbs: { [key: string]: number } = {};
    let sum = 0;
    Object.values(matchResults).forEach(value => sum += value);
    Object.entries(matchResults).forEach(([disease, percentage]) => {
      symptomProbs[disease] = sum > 0 ? percentage / sum : 0;
    });
    
    let topCondition = '';
    let maxProb = 0;
    Object.entries(symptomProbs).forEach(([condition, prob]) => {
      if (prob > maxProb) {
        maxProb = prob;
        topCondition = condition;
      }
    });
    
    setSymptomResult({
      condition: topCondition,
      confidence: maxProb,
      additional_info: { all_probabilities: symptomProbs }
    });
    
    // Calculate combined prediction
    if (imageResult) {
      const combined = calculateCombinedPrediction(imageResult, matchResults);
      setCombinedResult(combined);
    }
    
    setAnalysisStage('results');
  };
  
  const handleStartOver = () => {
    // Clear all state
    setImageResult(null);
    setFormData(null);
    setError(null);
    setSymptomResult(null);
    setCombinedResult(null);
    setAnalysisStage('upload');
    
    // Clear localStorage
    localStorage.removeItem('diagnosphere_imageResult');
    localStorage.removeItem('diagnosphere_formData');
    localStorage.removeItem('diagnosphere_symptomResult');
    localStorage.removeItem('diagnosphere_combinedResult');
    localStorage.removeItem('diagnosphere_requestId');
    localStorage.removeItem('diagnosphere_hasResults');
  };
  
  const renderPredictionForForm = () => {
    if (!imageResult) return null;
    
    // Log the values to debug
    console.log("Rendering prediction from:", imageResult);
    console.log("Condition:", imageResult.condition);
    console.log("Confidence:", imageResult.confidence);
    
    // Ensure we're providing non-null values with proper formatting
    return {
      prediction: imageResult.condition || "Unknown",
      confidence: (imageResult.confidence || 0) * 100
    };
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <Header/>
      <h1 className="text-3xl font-bold mb-6 text-white">Skin Condition Analysis</h1>
      
      {analysisStage === 'upload' && (
        <div className="mb-10">
          <p className="text-white/80 mb-6">
            Upload a clear image of the affected skin area for AI analysis. 
            After uploading, you'll be asked to provide additional symptoms to improve diagnosis accuracy.
          </p>
          <ImageUploader 
            onImageSelected={handleImageSelected}
            isLoading={isAnalyzing}
          />
          
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-white">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      )}
      
      {analysisStage === 'form' && (
        <div className="mb-10">
          <div className="mb-6">
            {isAnalyzing && (
              <div className="mb-4 p-3 bg-white/5 border border-white/20 rounded-lg flex items-center">
                <div className="w-5 h-5 border-2 border-diagnosphere-primary border-t-transparent rounded-full animate-spin mr-3"></div>
                <p className="text-white/80">
                  AI is analyzing your image in the background...
                </p>
              </div>
            )}
            
            {!isAnalyzing && imageResult && (
              <div className="mb-4 p-3 bg-diagnosphere-primary/10 border border-diagnosphere-primary/30 rounded-lg">
                <p className="text-white/80">
                  <span className="text-diagnosphere-primary font-medium">AI analysis complete!</span> The AI detected{' '}
                  <span className="font-bold">{imageResult.condition}</span> with {(imageResult.confidence * 100).toFixed(1)}% confidence.
                </p>
              </div>
            )}
            
            <DiagnosisForm 
              key={`form-${imageResult ? 'analyzed' : 'analyzing'}`}
              onSubmit={handleFormSubmit}
              prediction={imageResult ? renderPredictionForForm() : undefined}
            />
          </div>
        </div>
      )}
      
      {analysisStage === 'results' && imageResult && formData && symptomResult && combinedResult && (
        <div className="space-y-8">
          <div className="p-6 bg-white/5 border border-white/20 rounded-lg text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Comprehensive Analysis Results</h2>
              <button 
                onClick={handleStartOver}
                className="bg-diagnosphere-primary hover:bg-diagnosphere-primary/90 text-white px-3 py-2 rounded-md"
              >
                Start Over
              </button>
            </div>
            
            {/* First row: Image-Based and Symptom-Based Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Image-Based Analysis */}
              <div>
                <h3 className="text-xl font-medium mb-4 text-diagnosphere-primary">Image-Based Analysis</h3>
                <div className="mb-4">
                  <p className="text-lg font-medium">
                    Condition: <span className="text-diagnosphere-primary">{imageResult.condition}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Confidence: {(imageResult.confidence * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm text-gray-300">Probabilities:</p>
                  {Object.entries(imageResult.additional_info.all_probabilities).map(([condition, probability]) => (
                    <div key={condition} className="flex items-center">
                      <div className="w-32 text-sm capitalize">{condition}</div>
                      <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-diagnosphere-primary rounded-full"
                          style={{ width: `${probability * 100}%` }}
                        />
                      </div>
                      <div className="ml-3 text-sm w-12 text-right">
                        {(probability * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Symptom-Based Analysis */}
              <div>
                <h3 className="text-xl font-medium mb-4 text-diagnosphere-primary">Symptom-Based Analysis</h3>
                <div className="mb-4">
                  <p className="text-lg font-medium">
                    Condition: <span className="text-diagnosphere-primary">{symptomResult.condition}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Confidence: {(symptomResult.confidence * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm text-gray-300">Probabilities:</p>
                  {Object.entries(symptomResult.additional_info.all_probabilities).map(([condition, probability]) => (
                    <div key={condition} className="flex items-center">
                      <div className="w-32 text-sm capitalize">{condition}</div>
                      <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${probability * 100}%` }}
                        />
                      </div>
                      <div className="ml-3 text-sm w-12 text-right">
                        {(probability * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Second row: Combined Analysis */}
            <div className="bg-white/5 p-5 rounded-lg border border-white/10">
              <h3 className="text-xl font-medium mb-4 text-diagnosphere-primary">Combined Analysis</h3>
              <div className="mb-4">
                <p className="text-lg font-medium">
                  Condition: <span className="text-diagnosphere-primary">{combinedResult.condition}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Confidence: {(combinedResult.confidence * 100).toFixed(2)}%
                </p>
              </div>
              <div className="space-y-2 mb-6">
                <p className="font-medium text-sm text-gray-300">Probabilities:</p>
                {Object.entries(combinedResult.additional_info.all_probabilities).map(([condition, probability]) => (
                  <div key={condition} className="flex items-center">
                    <div className="w-32 text-sm capitalize">{condition}</div>
                    <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                        style={{ width: `${probability * 100}%` }}
                      />
                    </div>
                    <div className="ml-3 text-sm w-12 text-right">
                      {(probability * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Disease Complications Section */}
              {diseaseComplications[combinedResult.condition.toLowerCase()] && (
                <div className="mt-4 p-4 border border-diagnosphere-primary/30 bg-diagnosphere-primary/10 rounded-lg">
                  <h4 className="text-lg font-medium text-diagnosphere-primary mb-2">Potential Complications (Cross Risk Disease Assessment)</h4>
                  <p className="text-white/90 mb-3">
                    {diseaseComplications[combinedResult.condition.toLowerCase()].description}
                  </p>
                  
                  <h5 className="text-md font-medium text-white/80 mt-4 mb-2">Associated Conditions:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {diseaseComplications[combinedResult.condition.toLowerCase()].relatedConditions.map((condition, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-diagnosphere-primary mr-2"></div>
                        <span className="text-white/90">{condition}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm text-white/70">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-diagnosphere-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Consult a healthcare professional for proper diagnosis and treatment options.
                  </div>
                </div>
              )}
            </div>
            
            {/* Symptom Summary */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-xl font-medium mb-4 text-diagnosphere-primary">Symptom Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-300">Duration:</p>
                  <p className="text-white">{getDurationText(formData.duration)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Symptom Intensity:</p>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <p className="text-white">Itchiness: <span className="text-diagnosphere-primary">{formData.itchLevel}/10</span></p>
                    <p className="text-white">Pain: <span className="text-diagnosphere-primary">{formData.painLevel}/10</span></p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Visual Symptoms:</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {formData.hasRedness && <p className="text-white">✓ Redness</p>}
                    {formData.hasSwelling && <p className="text-white">✓ Swelling</p>}
                    {formData.hasBlisters && <p className="text-white">✓ Blisters or bumps</p>}
                    {formData.isScaly && <p className="text-white">✓ Scaling or flaky skin</p>}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Spread Pattern:</p>
                  <p className="text-white">{getSpreadText(formData.hasSpread)}</p>
                </div>
                {formData.previousTreatments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-300">Previous Treatments:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.previousTreatments.map(treatment => (
                        <span key={treatment} className="px-2 py-1 bg-white/10 text-white text-sm rounded">
                          {treatment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.additionalInfo && (
                  <div>
                    <p className="text-sm text-gray-300">Additional Information:</p>
                    <p className="text-white text-sm p-3 bg-white/5 rounded mt-1">{formData.additionalInfo}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-xl font-medium mb-4">What to do next</h3>
              <p className="text-sm text-gray-300 mb-5">
                This AI-powered analysis combines image and symptom data but is not a medical diagnosis.
                Consult a dermatologist to confirm the diagnosis and receive appropriate treatment.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => window.location.href = '/Contact'}
                  className="bg-diagnosphere-primary hover:bg-diagnosphere-primary/90 text-white px-6 py-3 rounded-md">
                  Get Professional Advice
                </button>
                <button 
                  onClick={() => {
                    if (!imageResult || !formData || !combinedResult) return;
                    
                    // Create PDF download using jsPDF
                    import('jspdf').then(({ default: jsPDF }) => {
                      import('jspdf-autotable').then(({ default: autoTable }) => {
                        const doc = new jsPDF();
                        
                        // Initialize autoTable
                        autoTable(doc, {});
                        
                        // Add title
                        doc.setFontSize(20);
                        doc.text("Diagnosphere - Skin Condition Analysis", 14, 22);
                        
                        // Add timestamp
                        doc.setFontSize(10);
                        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
                        
                        // Add combined result
                        doc.setFontSize(16);
                        doc.text("Diagnosis Result", 14, 40);
                        doc.setFontSize(12);
                        doc.text(`Condition: ${combinedResult.condition}`, 14, 48);
                        doc.text(`Confidence: ${(combinedResult.confidence * 100).toFixed(2)}%`, 14, 54);
                        
                        // Add probabilities table
                        const probData = Object.entries(combinedResult.additional_info.all_probabilities).map(
                          ([condition, probability]) => [condition, `${(probability * 100).toFixed(2)}%`]
                        );
                        
                        autoTable(doc, {
                          startY: 60,
                          head: [['Condition', 'Probability']],
                          body: probData,
                        });
                        
                        // Add patient symptoms
                        const finalY1 = doc.lastAutoTable.finalY;
                        doc.text("Patient Symptoms", 14, finalY1 + 10);
                        
                        const symptomRows = [
                          ['Duration', getDurationText(formData.duration)],
                          ['Onset', getOnsetText(formData.onset)],
                          ['Itch Level', `${formData.itchLevel}/10`],
                          ['Pain Level', `${formData.painLevel}/10`],
                          ['Has Redness', formData.hasRedness ? 'Yes' : 'No'],
                          ['Has Swelling', formData.hasSwelling ? 'Yes' : 'No'],
                          ['Has Blisters', formData.hasBlisters ? 'Yes' : 'No'],
                          ['Is Scaly', formData.isScaly ? 'Yes' : 'No'],
                          ['Affected Areas', formData.affectedAreas.join(', ')],
                          ['Previous Treatments', formData.previousTreatments.join(', ')]
                        ];
                        
                        autoTable(doc, {
                          startY: finalY1 + 15,
                          head: [['Symptom', 'Value']],
                          body: symptomRows,
                        });
                        
                        // Add disclaimer
                        const finalY2 = doc.lastAutoTable.finalY;
                        doc.setFontSize(10);
                        doc.text("DISCLAIMER: This is not a medical diagnosis. Please consult a healthcare professional.", 14, finalY2 + 15);
                        
                        // Save the PDF
                        doc.save(`Diagnosphere-Analysis-${new Date().toISOString().slice(0,10)}.pdf`);
                      });
                    });
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-md">
                  Save Results
                </button>
                <button 
                  onClick={() => {
                    if (!imageResult || !formData || !combinedResult) return;
                    // Create Excel download using SheetJS
                    void import('xlsx').then((XLSX) => {
                      // Create workbook
                      const wb = XLSX.utils.book_new();
                      
                      // Create diagnosis results sheet
                      const diagnosisData = [
                        ['Diagnosphere - Skin Condition Analysis'],
                        ['Generated on', new Date().toLocaleString()],
                        [''],
                        ['Combined Diagnosis Result'],
                        ['Condition', combinedResult.condition],
                        ['Confidence', `${(combinedResult.confidence * 100).toFixed(2)}%`],
                        [''],
                        ['Condition Probabilities']
                      ];
                      
                      // Add probability rows
                      Object.entries(combinedResult.additional_info.all_probabilities).forEach(([condition, probability]) => {
                        diagnosisData.push([condition, `${(probability * 100).toFixed(2)}%`]);
                      });
                      
                      // Create patient data sheet
                      const patientData = [
                        ['Patient Symptoms'],
                        ['Duration', getDurationText(formData.duration)],
                        ['Onset', getOnsetText(formData.onset)],
                        ['Itch Level', `${formData.itchLevel}/10`],
                        ['Pain Level', `${formData.painLevel}/10`],
                        ['Burning Level', `${formData.burningLevel}/10`],
                        ['Movement Discomfort', `${formData.movementDiscomfort}/10`],
                        ['Has Redness', formData.hasRedness ? 'Yes' : 'No'],
                        ['Has Swelling', formData.hasSwelling ? 'Yes' : 'No'],
                        ['Has Blisters', formData.hasBlisters ? 'Yes' : 'No'],
                        ['Is Scaly', formData.isScaly ? 'Yes' : 'No'],
                        ['Skin Color', formData.skinColor],
                        ['Border Type', formData.borderType],
                        ['Is Symmetrical', formData.isSymmetrical],
                        ['Surface Texture', formData.surfaceTexture.join(', ')],
                        ['Approximate Size', formData.approximateSize],
                        ['Has Size Changed', formData.hasSizeChanged],
                        ['Has Appearance Changed', formData.hasAppearanceChanged],
                        ['Is Dry', formData.isDry ? 'Yes' : 'No'],
                        ['Is Thickened', formData.isThickened ? 'Yes' : 'No'],
                        ['Is Warm', formData.isWarm ? 'Yes' : 'No'],
                        ['Is Cracked', formData.isCracked ? 'Yes' : 'No'],
                        ['Known Triggers', formData.knownTriggers.join(', ')],
                        ['Environment Factors', formData.environmentFactors.join(', ')],
                        ['Recent Illness', formData.recentIllness],
                        ['Has Spread', formData.hasSpread],
                        ['Affected Areas', formData.affectedAreas.join(', ')],
                        ['Personal History', formData.personalHistory.join(', ')],
                        ['Family History', formData.familyHistory.join(', ')],
                        ['Sun Exposure', formData.sunExposure],
                        ['Recent Sunburn', formData.recentSunburn],
                        ['Use Sunscreen', formData.useSunscreen],
                        ['Chemical Exposure', formData.chemicalExposure],
                        ['Smoking Status', formData.smokingStatus],
                        ['Has Nail Symptoms', formData.hasNailSymptoms ? 'Yes' : 'No'],
                        ['Has Joint Pain', formData.hasJointPain ? 'Yes' : 'No'],
                        ['Previous Treatments', formData.previousTreatments.join(', ')],
                        ['Treatment Effects', formData.treatmentEffects],
                        ['Additional Info', formData.additionalInfo]
                      ];
                      
                      // Create image analysis sheet
                      const imageAnalysisData = [
                        ['Image Analysis Results'],
                        ['Condition', imageResult.condition],
                        ['Confidence', `${(imageResult.confidence * 100).toFixed(2)}%`],
                        ['']
                      ];
                      
                      // Add probability rows for image analysis
                      imageAnalysisData.push(['Condition Probabilities']);
                      Object.entries(imageResult.additional_info.all_probabilities).forEach(([condition, probability]) => {
                        imageAnalysisData.push([condition, `${(probability * 100).toFixed(2)}%`]);
                      });
                      
                      // Create symptom analysis sheet
                      const symptomAnalysisData = [
                        ['Symptom Analysis Results'],
                        ['Condition', symptomResult?.condition || ''],
                        ['Confidence', symptomResult ? `${(symptomResult.confidence * 100).toFixed(2)}%` : ''],
                        ['']
                      ];
                      
                      // Add probability rows for symptom analysis
                      if (symptomResult) {
                        symptomAnalysisData.push(['Condition Probabilities']);
                        Object.entries(symptomResult.additional_info.all_probabilities).forEach(([condition, probability]) => {
                          symptomAnalysisData.push([condition, `${(probability * 100).toFixed(2)}%`]);
                        });
                      }
                      
                      // Add disclaimers
                      diagnosisData.push(['']);
                      diagnosisData.push(['DISCLAIMER: This is not a medical diagnosis. Please consult a healthcare professional.']);
                      
                      // Convert data to sheets
                      const diagnosisWs = XLSX.utils.aoa_to_sheet(diagnosisData);
                      const patientWs = XLSX.utils.aoa_to_sheet(patientData);
                      const imageAnalysisWs = XLSX.utils.aoa_to_sheet(imageAnalysisData);
                      const symptomAnalysisWs = XLSX.utils.aoa_to_sheet(symptomAnalysisData);
                      
                      // Add sheets to workbook
                      XLSX.utils.book_append_sheet(wb, diagnosisWs, 'Diagnosis Results');
                      XLSX.utils.book_append_sheet(wb, patientWs, 'Patient Data');
                      XLSX.utils.book_append_sheet(wb, imageAnalysisWs, 'Image Analysis');
                      XLSX.utils.book_append_sheet(wb, symptomAnalysisWs, 'Symptom Analysis');
                      
                      // Generate & download Excel file
                      XLSX.writeFile(wb, `Diagnosphere-Analysis-${new Date().toISOString().slice(0,10)}.xlsx`);
                    });
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-md">
                  Export Structured Data
                </button>
                <button
                  onClick={() => {
                    const requestId = imageResult?.additional_info?.request_id || '';
                    window.location.href = `/explain-predictions?imageResult=${encodeURIComponent(JSON.stringify(imageResult))}&formData=${encodeURIComponent(JSON.stringify(formData))}&symptomResult=${encodeURIComponent(JSON.stringify(symptomResult))}&combinedResult=${encodeURIComponent(JSON.stringify(combinedResult))}&requestId=${encodeURIComponent(requestId)}`;
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-md"
                >
                  Explain Predictions
                </button>
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinAnalysisPage;