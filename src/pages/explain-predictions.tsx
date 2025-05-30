import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Add jsPDF type extensions
import 'jspdf';
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
    lastAutoTable: any;
  }
}

interface AnalysisResult {
  condition: string;
  confidence: number;
  additional_info: {
    all_probabilities: { [key: string]: number };
    request_id?: string;
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

interface ImageExplanation {
  lime_image_path: string;
  occlusion_image_path: string;
  shap_image_path: string;
  features: { name: string; description: string; impact: number }[];
  request_id: string;
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
    recentSunburn: ['no', 'rarely'],
    useSunscreen: ['sometimes', 'often'],
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
    recentSunburn: ['no', 'rarely'],
    useSunscreen: ['sometimes', 'often'],
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

export const calculateDiseaseMatch = (formData: FormData): {
  results: { [key: string]: number };
  featureImportance: { [key: string]: { feature: string; impact: number }[] };
} => {
  const results: { [key: string]: number } = {};
  const featureImportance: { [key: string]: { feature: string; impact: number }[] } = {};

  Object.entries(diseaseProfiles).forEach(([disease, profile]) => {
    let totalPoints = 0;
    let matchPoints = 0;
    const importance: { feature: string; impact: number }[] = [];

    // Core characteristics (higher weight)
    if (profile.duration.includes(formData.duration)) {
      matchPoints += 2;
      importance.push({ feature: 'duration', impact: 2 });
    }
    totalPoints += 2;

    if (profile.onset.includes(formData.onset)) {
      matchPoints += 2;
      importance.push({ feature: 'onset', impact: 2 });
    }
    totalPoints += 2;

    if (formData.itchLevel >= profile.itchLevel.min && formData.itchLevel <= profile.itchLevel.max) {
      matchPoints += 1.5;
      importance.push({ feature: 'itchLevel', impact: 1.5 });
    }
    totalPoints += 1.5;

    if (formData.painLevel >= profile.painLevel.min && formData.painLevel <= profile.painLevel.max) {
      matchPoints += 1.5;
      importance.push({ feature: 'painLevel', impact: 1.5 });
    }
    totalPoints += 1.5;

    if (formData.burningLevel >= profile.burningLevel.min && formData.burningLevel <= profile.burningLevel.max) {
      matchPoints += 1;
      importance.push({ feature: 'burningLevel', impact: 1 });
    }
    totalPoints += 1;

    if (formData.movementDiscomfort >= profile.movementDiscomfort.min && 
        formData.movementDiscomfort <= profile.movementDiscomfort.max) {
      matchPoints += 1;
      importance.push({ feature: 'movementDiscomfort', impact: 1 });
    }
    totalPoints += 1;

    // Visual characteristics
    if (formData.hasRedness === profile.hasRedness) {
      matchPoints += 1;
      importance.push({ feature: 'hasRedness', impact: 1 });
    }
    if (formData.hasSwelling === profile.hasSwelling) {
      matchPoints += 1;
      importance.push({ feature: 'hasSwelling', impact: 1 });
    }
    if (formData.hasBlisters === profile.hasBlisters) {
      matchPoints += 1;
      importance.push({ feature: 'hasBlisters', impact: 1 });
    }
    if (formData.isScaly === profile.isScaly) {
      matchPoints += 1;
      importance.push({ feature: 'isScaly', impact: 1 });
    }
    totalPoints += 4;

    if (profile.skinColor.includes(formData.skinColor)) {
      matchPoints += 1.5;
      importance.push({ feature: 'skinColor', impact: 1.5 });
    }
    totalPoints += 1.5;

    if (profile.borderType.includes(formData.borderType)) {
      matchPoints += 1.5;
      importance.push({ feature: 'borderType', impact: 1.5 });
    }
    totalPoints += 1.5;

    if (profile.isSymmetrical.includes(formData.isSymmetrical)) {
      matchPoints += 1;
      importance.push({ feature: 'isSymmetrical', impact: 1 });
    }
    totalPoints += 1;

    let textureMatches = 0;
    if (formData.surfaceTexture && profile.surfaceTexture) {
      formData.surfaceTexture.forEach(texture => {
        if (profile.surfaceTexture.includes(texture)) textureMatches++;
      });
      if (textureMatches > 0) {
        const textureImpact = Math.min(1.5, (textureMatches / profile.surfaceTexture.length) * 1.5);
        matchPoints += textureImpact;
        importance.push({ feature: 'surfaceTexture', impact: textureImpact });
      }
    }
    totalPoints += 1.5;

    // Progression characteristics
    if (profile.hasSizeChanged.includes(formData.hasSizeChanged)) {
      matchPoints += 1;
      importance.push({ feature: 'hasSizeChanged', impact: 1 });
    }
    totalPoints += 1;

    if (profile.hasAppearanceChanged.includes(formData.hasAppearanceChanged)) {
      matchPoints += 1;
      importance.push({ feature: 'hasAppearanceChanged', impact: 1 });
    }
    totalPoints += 1;

    if (formData.isDry === profile.isDry) {
      matchPoints += 0.75;
      importance.push({ feature: 'isDry', impact: 0.75 });
    }
    if (formData.isThickened === profile.isThickened) {
      matchPoints += 0.75;
      importance.push({ feature: 'isThickened', impact: 0.75 });
    }
    if (formData.isWarm === profile.isWarm) {
      matchPoints += 0.75;
      importance.push({ feature: 'isWarm', impact: 0.75 });
    }
    if (formData.isCracked === profile.isCracked) {
      matchPoints += 0.75;
      importance.push({ feature: 'isCracked', impact: 0.75 });
    }
    totalPoints += 3;

    // Triggers and environmental factors
    let triggerMatches = 0;
    if (formData.knownTriggers && profile.knownTriggers) {
      formData.knownTriggers.forEach(trigger => {
        if (profile.knownTriggers.includes(trigger)) triggerMatches++;
      });
      if (triggerMatches > 0 && profile.knownTriggers.length > 0) {
        const triggerImpact = Math.min(1.5, (triggerMatches / profile.knownTriggers.length) * 1.5);
        matchPoints += triggerImpact;
        importance.push({ feature: 'knownTriggers', impact: triggerImpact });
      }
    }
    totalPoints += 1.5;

    let envFactorMatches = 0;
    if (formData.environmentFactors && profile.environmentFactors) {
      formData.environmentFactors.forEach(factor => {
        if (profile.environmentFactors.includes(factor)) envFactorMatches++;
      });
      if (envFactorMatches > 0 && profile.environmentFactors.length > 0) {
        const envImpact = Math.min(1, (envFactorMatches / profile.environmentFactors.length) * 1);
        matchPoints += envImpact;
        importance.push({ feature: 'environmentFactors', impact: envImpact });
      }
    }
    totalPoints += 1;

    if (profile.hasSpread.includes(formData.hasSpread)) {
      matchPoints += 1.5;
      importance.push({ feature: 'hasSpread', impact: 1.5 });
    }
    totalPoints += 1.5;

    // Affected areas
    let areaMatches = 0;
    if (formData.affectedAreas && profile.affectedAreas) {
      formData.affectedAreas.forEach(area => {
        if (profile.affectedAreas.includes(area)) areaMatches++;
      });
      if (areaMatches > 0) {
        const areaImpact = Math.min(2, (areaMatches / profile.affectedAreas.length) * 2);
        matchPoints += areaImpact;
        importance.push({ feature: 'affectedAreas', impact: areaImpact });
      }
    }
    totalPoints += 2;

    // Medical history
    let personalHistoryMatches = 0;
    if (formData.personalHistory && profile.personalHistory) {
      formData.personalHistory.forEach(condition => {
        if (profile.personalHistory.includes(condition)) personalHistoryMatches++;
      });
      if (personalHistoryMatches > 0) {
        const historyImpact = Math.min(1.5, (personalHistoryMatches / profile.personalHistory.length) * 1.5);
        matchPoints += historyImpact;
        importance.push({ feature: 'personalHistory', impact: historyImpact });
      }
    }
    totalPoints += 1.5;

    let familyHistoryMatches = 0;
    if (formData.familyHistory && profile.familyHistory) {
      formData.familyHistory.forEach(condition => {
        if (profile.familyHistory.includes(condition)) familyHistoryMatches++;
      });
      if (familyHistoryMatches > 0) {
        const familyImpact = Math.min(1.5, (familyHistoryMatches / profile.familyHistory.length) * 1.5);
        matchPoints += familyImpact;
        importance.push({ feature: 'familyHistory', impact: familyImpact });
      }
    }
    totalPoints += 1.5;

    // Sun exposure and related factors
    if (profile.sunExposure?.includes(formData.sunExposure)) {
      matchPoints += 1;
      importance.push({ feature: 'sunExposure', impact: 1 });
    }
    totalPoints += 1;

    if (profile.recentSunburn?.includes(formData.recentSunburn)) {
      matchPoints += 0.75;
      importance.push({ feature: 'recentSunburn', impact: 0.75 });
    }
    totalPoints += 0.75;

    if (profile.useSunscreen?.includes(formData.useSunscreen)) {
      matchPoints += 0.75;
      importance.push({ feature: 'useSunscreen', impact: 0.75 });
    }
    totalPoints += 0.75;

    // Additional symptoms
    if (formData.hasNailSymptoms === profile.hasNailSymptoms) {
      matchPoints += 1;
      importance.push({ feature: 'hasNailSymptoms', impact: 1 });
    }
    if (formData.hasJointPain === profile.hasJointPain) {
      matchPoints += 1;
      importance.push({ feature: 'hasJointPain', impact: 1 });
    }
    totalPoints += 2;

    // Treatments
    let treatmentMatchCount = 0;
    if (profile.commonTreatments && profile.commonTreatments.length > 0) {
      profile.commonTreatments.forEach(treatment => {
        if (formData.previousTreatments.includes(treatment)) treatmentMatchCount++;
      });
      const treatmentImpact = Math.min(1.5, (treatmentMatchCount / profile.commonTreatments.length) * 1.5);
      matchPoints += treatmentImpact;
      importance.push({ feature: 'previousTreatments', impact: treatmentImpact });
      totalPoints += 1.5;
    }

    results[disease] = Math.round((matchPoints / totalPoints) * 100);
    featureImportance[disease] = importance;
  });

  return { results, featureImportance };
};

const ExplainPredictions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageResult, setImageResult] = useState<AnalysisResult | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [symptomResult, setSymptomResult] = useState<AnalysisResult | null>(null);
  const [combinedResult, setCombinedResult] = useState<AnalysisResult | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [imageExplanation, setImageExplanation] = useState<ImageExplanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  // Create refs for capturing chart images
  const imageChartRef = useRef<HTMLDivElement>(null);
  const symptomChartRef = useRef<HTMLDivElement>(null);
  const combinedChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    try {
      const imageResultParam = searchParams.get('imageResult');
      const formDataParam = searchParams.get('formData');
      const symptomResultParam = searchParams.get('symptomResult');
      const combinedResultParam = searchParams.get('combinedResult');
      const requestIdParam = searchParams.get('requestId');

      if (imageResultParam) {
        const parsedImageResult = JSON.parse(decodeURIComponent(imageResultParam));
        setImageResult(parsedImageResult);
        localStorage.setItem('diagnosphere_imageResult', decodeURIComponent(imageResultParam));
      }
      
      if (formDataParam) {
        const parsedFormData = JSON.parse(decodeURIComponent(formDataParam));
        setFormData(parsedFormData);
        localStorage.setItem('diagnosphere_formData', decodeURIComponent(formDataParam));
      }
      
      if (symptomResultParam) {
        const parsedSymptomResult = JSON.parse(decodeURIComponent(symptomResultParam));
        setSymptomResult(parsedSymptomResult);
        localStorage.setItem('diagnosphere_symptomResult', decodeURIComponent(symptomResultParam));
      }
      
      if (combinedResultParam) {
        const parsedCombinedResult = JSON.parse(decodeURIComponent(combinedResultParam));
        setCombinedResult(parsedCombinedResult);
        localStorage.setItem('diagnosphere_combinedResult', decodeURIComponent(combinedResultParam));
      }
      
      if (requestIdParam) {
        setRequestId(decodeURIComponent(requestIdParam));
        localStorage.setItem('diagnosphere_requestId', decodeURIComponent(requestIdParam));
      }
      
      // Set a flag indicating we have results to restore
      localStorage.setItem('diagnosphere_hasResults', 'true');
      
    } catch (err) {
      setError('Failed to load prediction data');
    }
  }, [location.search]);

  useEffect(() => {
    const fetchImageExplanation = async () => {
      if (!requestId || !imageResult) {
        setError('Missing request ID or image result');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:8000/explain-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request_id: requestId,
            image_result: imageResult,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch explanation');
        }

        const data = await response.json();
        setImageExplanation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch explanation');
      } finally {
        setIsLoading(false);
      }
    };

    if (imageResult && requestId) {
      fetchImageExplanation();
    }
  }, [imageResult, requestId]);

  const renderImageExplanation = () => {
    if (isLoading) return <p className="text-white/80">Loading image explanation...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!imageExplanation) return null;
  
    // Separate features into LIME regions and Occlusion Analysis
    const limeFeatures = imageExplanation.features.filter(f => f.name.startsWith("Region"));
    const occlusionFeature = imageExplanation.features.find(f => f.name === "Occlusion Analysis");
  
    // Use raw LIME impacts (convert to percentage for display)
    const limeImpacts = limeFeatures.map(f => {
      const impact = typeof f.impact === 'number' ? f.impact : parseFloat(f.impact as string);
      return impact * 100; // Convert to percentage
    });
  
    // Use raw occlusion impact (convert to percentage for display)
    const occlusionImpact = occlusionFeature 
      ? (typeof occlusionFeature.impact === 'number' ? occlusionFeature.impact : parseFloat(occlusionFeature.impact as string)) * 100 
      : 0;
  
    const limeChartData = {
      labels: limeFeatures.map(f => f.name),
      datasets: [
        {
          label: 'LIME Region Impact (%)',
          data: limeImpacts,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  
    const occlusionChartData = {
      labels: occlusionFeature ? ['Occlusion Analysis'] : [],
      datasets: [
        {
          label: 'Occlusion Impact (%)',
          data: occlusionFeature ? [occlusionImpact] : [],
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  
    return (
      <div className="bg-white/5 border border-white/20 rounded-lg p-6">
        <h3 className="text-xl font-medium mb-4 text-diagnosphere-primary">Image-Based Prediction Explanation</h3>
        <p className="text-white/80 mb-4">
          The AI model analyzed the uploaded image and identified <strong>{imageResult?.condition}</strong> with a
          confidence of {(typeof imageResult?.confidence === 'number' ? imageResult.confidence : parseFloat(imageResult?.confidence as string)) * 100}%. Below are the raw, unscaled insights into how the
          model made its prediction. These values represent the direct impact of each feature on the prediction score,
          providing a transparent view of the model's decision-making process.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {imageExplanation.lime_image_path && (
            <div className="flex-1">
              <p className="text-white/80 mb-2 font-semibold">LIME Explanation</p>
              <p className="text-white/60 text-sm mb-2">
                Highlights regions of the image that influence the prediction using Local Interpretable Model-agnostic
                Explanations (LIME). The impact values below are raw weights from LIME, representing the change in prediction
                score when a region is included.
              </p>
              <img
                src={`http://localhost:8000/${imageExplanation.lime_image_path}`}
                alt="LIME Explanation"
                width={224}
                height={224}
                className="rounded-lg"
              />
            </div>
          )}
          {imageExplanation.occlusion_image_path && (
            <div className="flex-1">
              <p className="text-white/80 mb-2 font-semibold">Occlusion Sensitivity</p>
              <p className="text-white/60 text-sm mb-2">
                Shows areas where occluding parts of the image reduces prediction confidence. The impact value below is the
                maximum decrease in prediction score when a region is occluded, reflecting raw sensitivity.
              </p>
              <img
                src={`http://localhost:8000/${imageExplanation.occlusion_image_path}`}
                alt="Occlusion Sensitivity"
                width={224}
                height={224}
                className="rounded-lg"
              />
            </div>
          )}
          {imageExplanation.shap_image_path && (
            <div className="flex-1">
              <p className="text-white/80 mb-2 font-semibold">SHAP Explanation</p>
              <p className="text-white/60 text-sm mb-2">
                Uses SHAP (SHapley Additive exPlanations) to show which pixels contribute positively or negatively to the
                prediction.
              </p>
              <img
                src={`http://localhost:8000/${imageExplanation.shap_image_path}`}
                alt="SHAP Explanation"
                width={224}
                height={224}
                className="rounded-lg"
              />
            </div>
          )}
        </div>
        <h4 className="text-lg font-medium mb-2 text-white">Key Features</h4>
        {/* LIME Regions Chart */}
        {limeFeatures.length > 0 && (
          <div className="mb-6">
            <h5 className="text-md font-medium mb-2 text-white">LIME Region Contributions</h5>
            <Bar
              data={limeChartData}
              options={{
                responsive: true,
                plugins: { 
                  legend: { display: true },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = typeof context.raw === 'number' ? context.raw : parseFloat(context.raw as string);
                        return `${context.dataset.label}: ${isNaN(value) ? 'N/A' : value.toFixed(6)}%`;
                      }
                    }
                  }
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    max: Math.max(...limeImpacts, 10) * 1.1, // Dynamic max based on data, minimum 10%
                    title: { display: true, text: 'Impact on Prediction Score (%)' },
                    ticks: {
                      callback: (value) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                        return `${isNaN(numValue) ? 'N/A' : numValue.toFixed(2)}%`;
                      }
                    }
                  },
                  x: { title: { display: true, text: 'Region' } },
                },
              }}
            />
          </div>
        )}
        {/* Occlusion Analysis Chart */}
        {occlusionFeature && (
          <div className="mb-6">
            <h5 className="text-md font-medium mb-2 text-white">Occlusion Sensitivity Contribution</h5>
            <Bar
              data={occlusionChartData}
              options={{
                responsive: true,
                plugins: { 
                  legend: { display: true },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = typeof context.raw === 'number' ? context.raw : parseFloat(context.raw as string);
                        return `${context.dataset.label}: ${isNaN(value) ? 'N/A' : value.toFixed(6)}%`;
                      }
                    }
                  }
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    max: Math.max(occlusionImpact, 0.01) * 1.1, // Dynamic max, minimum 0.01%
                    title: { display: true, text: 'Impact on Prediction Score (%)' },
                    ticks: {
                      callback: (value) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                        return `${isNaN(numValue) ? 'N/A' : numValue.toFixed(6)}%`;
                      }
                    }
                  },
                  x: { title: { display: true, text: 'Analysis' } },
                },
              }}
            />
          </div>
        )}
        <ul className="list-disc pl-5 space-y-2 text-white/80 mt-4">
          {imageExplanation.features.map((feature, index) => {
            const impactValue = typeof feature.impact === 'number' ? feature.impact : parseFloat(feature.impact as string);
            return (
              <li key={index}>
                {feature.name}: {feature.description} (Impact: {isNaN(impactValue) ? 'N/A' : impactValue.toFixed(6)})
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderSymptomExplanation = () => {
    if (!formData || !symptomResult) return null;

    const { results, featureImportance } = calculateDiseaseMatch(formData);
    const topFeatures = featureImportance[symptomResult.condition.toLowerCase()]
      ?.sort((a, b) => b.impact - a.impact)
      .slice(0, 10);

    const chartData = {
      labels: topFeatures?.map(f => f.feature) || [],
      datasets: [
        {
          label: 'Feature Impact',
          data: topFeatures?.map(f => (f.impact / topFeatures.reduce((sum, f) => sum + f.impact, 0)) * 100) || [],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="bg-white/5 border border-white/20 rounded-lg p-6">
        <h3 className="text-xl font-medium mb-4 text-diagnosphere-primary">Symptom-Based Prediction Explanation</h3>
        <p className="text-white/80 mb-4">
          The symptom-based analysis identified <strong>{symptomResult.condition}</strong> with a confidence of{' '}
          {(symptomResult.confidence * 100).toFixed(2)}%. The following symptoms and characteristics were most influential
          in the prediction, based on their alignment with known disease profiles:
        </p>
        <h4 className="text-lg font-medium mb-2 text-white">Key Symptoms and Characteristics</h4>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 100, title: { display: true, text: 'Relative Impact (%)' } },
              x: { title: { display: true, text: 'Symptom/Characteristic' } },
            },
          }}
        />
        <ul className="list-disc pl-5 space-y-2 text-white/80 mt-4">
          {topFeatures?.map((item, index) => (
            <li key={index}>
              {item.feature}: {JSON.stringify(formData[item.feature as keyof FormData], null, 2)} (Relative Impact: {((item.impact / topFeatures.reduce((sum, f) => sum + f.impact, 0)) * 100).toFixed(1)}%)
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderCombinedExplanation = () => {
    if (!combinedResult) return null;

    const chartData = {
      labels: ['Image Analysis', 'Symptom Analysis'],
      datasets: [
        {
          label: 'Contribution (%)',
          data: [imageResult?.confidence * 70, symptomResult?.confidence * 30],
          backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)'],
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="bg-white/5 border border-white/20 rounded-lg p-6">
        <h3 className="text-xl font-medium mb-4 text-diagnosphere-primary">Combined Prediction Explanation</h3>
        <p className="text-white/80 mb-4">
          The combined analysis weighted image-based (70%) and symptom-based (30%) predictions to identify{' '}
          <strong>{combinedResult.condition}</strong> with a confidence of{' '}
          {(combinedResult.confidence * 100).toFixed(2)}%. The image analysis had a stronger influence due to its higher
          weight.
        </p>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 100, title: { display: true, text: 'Contribution (%)' } },
              x: { title: { display: true, text: 'Analysis Type' } },
            },
          }}
        />
        <p className="text-white/80 mt-4">
          Key factors:
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Image Analysis: {(imageResult?.confidence * 100).toFixed(2)}% confidence in {imageResult?.condition}
            </li>
            <li>
              Symptom Analysis: {(symptomResult?.confidence * 100).toFixed(2)}% confidence in {symptomResult?.condition}
            </li>
          </ul>
        </p>
      </div>
    );
  };

  const handleBackToAnalysis = () => {
    // Navigate back to skin-check with a flag to indicate we should show results
    navigate('/skin-check?showResults=true');
  };

  const handleSaveAsPDF = async () => {
    try {
      setIsSavingPdf(true);
      
      // Import libraries
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const html2canvas = (await import('html2canvas')).default;
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("Diagnosphere - AI Prediction Explanations", 15, 15);
      
      // Add timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 22);
      
      // Add condition prediction
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Diagnosis Prediction", 15, 30);
      doc.setFontSize(12);
      doc.text(`Condition: ${combinedResult?.condition || 'Not available'}`, 15, 38);
      doc.text(`Confidence: ${combinedResult ? (combinedResult.confidence * 100).toFixed(2) + '%' : 'Not available'}`, 15, 44);
      
      // Add patient details
      doc.text(`Patient ID: ${requestId || 'Anonymous'}`, 15, 50);
      
      // Add section divider
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 55, 195, 55);
      
      // Add Image Analysis section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("1. Image-Based Analysis", 15, 62);
      
      let currentY = 68;
      
      if (imageExplanation) {
        // Add image explanations
        doc.setFontSize(12);
        doc.text("Explanation Visualizations:", 20, currentY);
        currentY += 6;
        
        // Calculate image placement
        const imageWidth = 50; // mm
        const imageHeight = 50; // mm
        const margin = 20; // mm from left
        const spacing = 5; // mm between images
        
        // Add explanation images if available
        if (imageExplanation.lime_image_path) {
          try {
            // Create image element to load the image
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = `http://localhost:8000/${imageExplanation.lime_image_path}`;
            
            await new Promise((resolve) => {
              img.onload = resolve;
              // If image fails to load after 3 seconds, continue
              setTimeout(resolve, 3000);
            });
            
            doc.addImage(img, 'JPEG', margin, currentY, imageWidth, imageHeight);
            doc.setFontSize(8);
            doc.text("LIME Regions", margin + imageWidth/2 - 10, currentY + imageHeight + 5);
          } catch (error) {
            console.error("Error adding LIME image to PDF:", error);
          }
        }
        
        if (imageExplanation.occlusion_image_path) {
          try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = `http://localhost:8000/${imageExplanation.occlusion_image_path}`;
            
            await new Promise((resolve) => {
              img.onload = resolve;
              setTimeout(resolve, 3000);
            });
            
            doc.addImage(img, 'JPEG', margin + imageWidth + spacing, currentY, imageWidth, imageHeight);
            doc.setFontSize(8);
            doc.text("Occlusion Sensitivity", margin + imageWidth + spacing + imageWidth/2 - 15, currentY + imageHeight + 5);
          } catch (error) {
            console.error("Error adding occlusion image to PDF:", error);
          }
        }
        
        if (imageExplanation.shap_image_path) {
          try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = `http://localhost:8000/${imageExplanation.shap_image_path}`;
            
            await new Promise((resolve) => {
              img.onload = resolve;
              setTimeout(resolve, 3000);
            });
            
            doc.addImage(img, 'JPEG', margin + 2 * (imageWidth + spacing), currentY, imageWidth, imageHeight);
            doc.setFontSize(8);
            doc.text("SHAP Values", margin + 2 * (imageWidth + spacing) + imageWidth/2 - 10, currentY + imageHeight + 5);
          } catch (error) {
            console.error("Error adding SHAP image to PDF:", error);
          }
        }
        
        currentY += imageHeight + 10;
        
        // Add feature importance table
        if (imageExplanation.features && imageExplanation.features.length > 0) {
          doc.setFontSize(12);
          doc.text("Key Visual Features:", 20, currentY);
          currentY += 5;
          
          const featureRows = imageExplanation.features.map(feature => [
            feature.name, 
            feature.description,
            typeof feature.impact === 'number' ? feature.impact.toFixed(6) : feature.impact
          ]);
          
          autoTable(doc, {
            startY: currentY,
            head: [['Feature', 'Description', 'Impact']],
            body: featureRows,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            margin: { left: 20 }
          });
          
          currentY = doc.lastAutoTable.finalY + 10;
        }
      } else {
        doc.setFontSize(12);
        doc.text("No detailed image analysis available", 20, currentY);
        currentY += 10;
      }
      
      // Add page break if needed
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      // Add Symptom Analysis section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("2. Symptom-Based Analysis", 15, currentY);
      currentY += 8;
      
      if (symptomResult && formData) {
        // Calculate symptom analysis
        const { results, featureImportance } = calculateDiseaseMatch(formData);
        const topFeatures = featureImportance[symptomResult.condition.toLowerCase()]
          ?.sort((a, b) => b.impact - a.impact)
          .slice(0, 10);
        
        if (topFeatures && topFeatures.length > 0) {
          // Try to capture symptom chart if visible in DOM
          if (symptomChartRef.current) {
            try {
              const canvas = await html2canvas(symptomChartRef.current);
              const imgData = canvas.toDataURL('image/jpeg', 0.75);
              doc.addImage(imgData, 'JPEG', 20, currentY, 170, 80);
              currentY += 85;
            } catch (err) {
              console.error("Error capturing symptom chart:", err);
              // Skip chart if it fails
              currentY += 5;
            }
          }
          
          // Add top symptoms table
          const symptomRows = topFeatures.map(feature => {
            const featureValue = formData[feature.feature as keyof FormData];
            const displayValue = Array.isArray(featureValue) 
              ? featureValue.join(', ')
              : typeof featureValue === 'boolean'
                ? featureValue ? 'Yes' : 'No'
                : String(featureValue);
                
            return [
              feature.feature,
              displayValue,
              ((feature.impact / topFeatures.reduce((sum, f) => sum + f.impact, 0)) * 100).toFixed(1) + '%'
            ];
          });
          
          autoTable(doc, {
            startY: currentY,
            head: [['Symptom', 'Patient Value', 'Relative Impact']],
            body: symptomRows,
            theme: 'striped',
            headStyles: { fillColor: [52, 152, 219], textColor: 255 },
            margin: { left: 20 }
          });
          
          currentY = doc.lastAutoTable.finalY + 10;
        } else {
          doc.setFontSize(12);
          doc.text("No symptom importance data available", 20, currentY);
          currentY += 10;
        }
      } else {
        doc.setFontSize(12);
        doc.text("No symptom analysis available", 20, currentY);
        currentY += 10;
      }
      
      // Add page break if needed
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      // Add Combined Analysis section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("3. Combined Analysis", 15, currentY);
      currentY += 8;
      
      if (combinedResult) {
        // Try to capture combined chart if visible in DOM
        if (combinedChartRef.current) {
          try {
            const canvas = await html2canvas(combinedChartRef.current);
            const imgData = canvas.toDataURL('image/jpeg', 0.75);
            doc.addImage(imgData, 'JPEG', 20, currentY, 170, 80);
            currentY += 85;
          } catch (err) {
            console.error("Error capturing combined chart:", err);
            // Skip chart if it fails
            currentY += 5;
          }
        }
        
        // Add combined probabilities table
        const probabilityRows = Object.entries(combinedResult.additional_info.all_probabilities).map(
          ([condition, probability]) => [condition, (probability * 100).toFixed(2) + '%']
        );
        
        autoTable(doc, {
          startY: currentY,
          head: [['Condition', 'Combined Probability']],
          body: probabilityRows,
          theme: 'striped',
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          margin: { left: 20 }
        });
        
        currentY = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(12);
        doc.text("No combined analysis available", 20, currentY);
        currentY += 10;
      }
      
      // Add disclaimer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const disclaimer = "DISCLAIMER: This is not a medical diagnosis. The explanations provided are for educational purposes only. Please consult a healthcare professional for proper diagnosis and treatment.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
      doc.text(splitDisclaimer, 15, 270);
      
      // Save the PDF
      doc.save(`Diagnosphere-Explanations-${new Date().toISOString().slice(0,10)}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsSavingPdf(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <Header />
      <h1 className="text-3xl font-bold mb-6 text-white">Prediction Explanations</h1>
      <div className="space-y-8">
        <div ref={imageChartRef}>
          {renderImageExplanation()}
        </div>
        <div ref={symptomChartRef}>
          {renderSymptomExplanation()}
        </div>
        <div ref={combinedChartRef}>
          {renderCombinedExplanation()}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={handleBackToAnalysis}
          className="bg-diagnosphere-primary hover:bg-diagnosphere-primary/90 text-white px-6 py-3 rounded-md"
        >
          Back to Analysis
        </button>
        <button
          onClick={handleSaveAsPDF}
          disabled={isSavingPdf}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-md flex items-center"
        >
          {isSavingPdf ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Generating PDF...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Save as PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExplainPredictions;