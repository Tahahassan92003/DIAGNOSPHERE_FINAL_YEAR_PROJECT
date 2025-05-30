import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Check, Upload, Info } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DiagnosisFormProps {
  onSubmit: (data: FormData) => void;
  prediction?: any;
}

interface FormData {
  // Duration & Onset
  duration: string;
  onset: string;
  
  // Intensity & Sensations
  itchLevel: number;
  painLevel: number;
  burningLevel: number;
  movementDiscomfort: number;
  
  // Visual Symptoms
  hasRedness: boolean;
  hasSwelling: boolean;
  hasBlisters: boolean;
  isScaly: boolean;
  skinColor: string;
  borderType: string;
  isSymmetrical: string;
  surfaceTexture: string[];
  
  // Size & Evolution
  approximateSize: string;
  hasSizeChanged: string;
  hasAppearanceChanged: string;
  
  // Texture & Physical Feel
  isDry: boolean;
  isThickened: boolean;
  isWarm: boolean;
  isCracked: boolean;
  
  // Triggers & Patterns
  knownTriggers: string[];
  environmentFactors: string[];
  recentIllness: string;
  
  // Spread & Location
  hasSpread: string;
  affectedAreas: string[];
  
  // Medical & Family History
  personalHistory: string[];
  familyHistory: string[];
  
  // Environmental & Lifestyle
  sunExposure: string;
  recentSunburn: string;
  useSunscreen: string;
  chemicalExposure: string;
  smokingStatus: string;
  
  // Nail & Joint Symptoms
  hasNailSymptoms: boolean;
  hasJointPain: boolean;
  
  // Previous Treatments
  previousTreatments: string[];
  treatmentEffects: string;
  
  // Additional Information
  additionalInfo: string;
  
  // Photo Upload (optional)

}

const DiagnosisForm = ({ onSubmit, prediction }: DiagnosisFormProps) => {
  // Add debugging log
  console.log("DiagnosisForm received prediction:", prediction);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    // Duration & Onset
    duration: '',
    onset: '',
    
    // Intensity & Sensations
    itchLevel: 0,
    painLevel: 0,
    burningLevel: 0,
    movementDiscomfort: 0,
    
    // Visual Symptoms
    hasRedness: false,
    hasSwelling: false,
    hasBlisters: false,
    isScaly: false,
    skinColor: '',
    borderType: '',
    isSymmetrical: '',
    surfaceTexture: [],
    
    // Size & Evolution
    approximateSize: '',
    hasSizeChanged: '',
    hasAppearanceChanged: '',
    
    // Texture & Physical Feel
    isDry: false,
    isThickened: false,
    isWarm: false,
    isCracked: false,
    
    // Triggers & Patterns
    knownTriggers: [],
    environmentFactors: [],
    recentIllness: '',
    
    // Spread & Location
    hasSpread: '',
    affectedAreas: [],
    
    // Medical & Family History
    personalHistory: [],
    familyHistory: [],
    
    // Environmental & Lifestyle
    sunExposure: '',
    recentSunburn: '',
    useSunscreen: '',
    chemicalExposure: '',
    smokingStatus: '',
    
    // Nail & Joint Symptoms
    hasNailSymptoms: false,
    hasJointPain: false,
    
    // Previous Treatments
    previousTreatments: [],
    treatmentEffects: '',
    
    // Additional Information
    additionalInfo: '',
    
  });

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof FormData, item: string) => {
    setFormData((prev) => {
      const current = [...prev[key] as string[]];
      if (current.includes(item)) {
        return {
          ...prev,
          [key]: current.filter((t) => t !== item),
        };
      } else {
        return {
          ...prev,
          [key]: [...current, item],
        };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  // Form Options
  const durationOptions = [
    { value: 'lessThanWeek', label: 'Less than a week' },
    { value: '1-4weeks', label: '1-4 weeks' },
    { value: '1-3months', label: '1-3 months' },
    { value: '3-6months', label: '3-6 months' },
    { value: 'moreThan6months', label: 'More than 6 months' },
  ];

  const onsetOptions = [
    { value: 'sudden', label: 'Suddenly (appeared within hours/days)' },
    { value: 'gradual', label: 'Gradually (developed over weeks/months)' },
  ];

  const spreadOptions = [
    { value: 'no', label: 'No, it has remained in one area' },
    { value: 'slightly', label: 'Yes, it has spread slightly' },
    { value: 'significantly', label: 'Yes, it has spread significantly' },
  ];

  const symptomOptions = [
    { id: 'hasRedness', label: 'Redness' },
    { id: 'hasSwelling', label: 'Swelling' },
    { id: 'hasBlisters', label: 'Blisters or bumps' },
    { id: 'isScaly', label: 'Scaling or flaky skin' },
  ];

  const textureOptions = [
    { id: 'isDry', label: 'Dry' },
    { id: 'isThickened', label: 'Thickened or leathery' },
    { id: 'isWarm', label: 'Warm to the touch' },
    { id: 'isCracked', label: 'Cracked or bleeding' },
  ];

  const skinColorOptions = [
    { value: 'pink', label: 'Pink' },
    { value: 'red', label: 'Red' },
    { value: 'purple', label: 'Purple' },
    { value: 'brown', label: 'Brown' },
    { value: 'black', label: 'Black' },
    { value: 'other', label: 'Other' },
  ];

  const borderTypeOptions = [
    { value: 'wellDefined', label: 'Well-defined/clear borders' },
    { value: 'irregular', label: 'Irregular/blurry borders' },
  ];

  const symmetryOptions = [
    { value: 'symmetrical', label: 'Symmetrical (similar on both sides)' },
    { value: 'asymmetrical', label: 'Asymmetrical (irregular shape)' },
  ];

  const surfaceTextureOptions = [
    { value: 'smooth', label: 'Smooth' },
    { value: 'rough', label: 'Rough' },
    { value: 'crusted', label: 'Crusted' },
    { value: 'oozing', label: 'Oozing' },
    { value: 'flaky', label: 'Flaky' },
    { value: 'silvery', label: 'Silvery-white scales' },
  ];

  const sizeChangedOptions = [
    { value: 'increased', label: 'Yes, it has grown larger' },
    { value: 'decreased', label: 'Yes, it has gotten smaller' },
    { value: 'noChange', label: 'No, the size has remained the same' },
  ];

  const appearanceChangedOptions = [
    { value: 'color', label: 'Yes, the color has changed' },
    { value: 'shape', label: 'Yes, the shape has changed' },
    { value: 'both', label: 'Yes, both color and shape have changed' },
    { value: 'noChange', label: 'No, appearance has remained the same' },
  ];

  const triggerOptions = [
    { value: 'stress', label: 'Stress' },
    { value: 'allergens', label: 'Allergens' },
    { value: 'sunExposure', label: 'Sun exposure' },
    { value: 'food', label: 'Specific foods' },
    { value: 'skincare', label: 'New skincare products' },
    { value: 'unknown', label: 'Unknown' },
  ];

  const environmentFactorOptions = [
    { value: 'hot', label: 'Hot weather' },
    { value: 'cold', label: 'Cold weather' },
    { value: 'dry', label: 'Dry environment' },
    { value: 'humid', label: 'Humid environment' },
  ];

  const affectedAreaOptions = [
    { value: 'face', label: 'Face' },
    { value: 'scalp', label: 'Scalp' },
    { value: 'neck', label: 'Neck' },
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'arms', label: 'Arms' },
    { value: 'hands', label: 'Hands' },
    { value: 'legs', label: 'Legs' },
    { value: 'feet', label: 'Feet' },
    { value: 'joints', label: 'Near joints (elbows, knees)' },
    { value: 'folds', label: 'Skin folds' },
  ];

  const personalHistoryOptions = [
    { value: 'eczema', label: 'Eczema' },
    { value: 'psoriasis', label: 'Psoriasis' },
    { value: 'skinCancer', label: 'Skin cancer' },
    { value: 'asthma', label: 'Asthma' },
    { value: 'hayFever', label: 'Hay fever' },
    { value: 'autoimmune', label: 'Autoimmune diseases' },
  ];

  const familyHistoryOptions = [
    { value: 'eczema', label: 'Eczema' },
    { value: 'psoriasis', label: 'Psoriasis' },
    { value: 'skinCancer', label: 'Skin cancer (especially melanoma)' },
    { value: 'autoimmune', label: 'Autoimmune diseases' },
  ];

  const sunExposureOptions = [
    { value: 'frequent', label: 'Frequent sun exposure' },
    { value: 'occasional', label: 'Occasional sun exposure' },
    { value: 'rare', label: 'Rare sun exposure' },
    { value: 'tanningBed', label: 'Tanning bed use' },
  ];

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  const sunscreenOptions = [
    { value: 'always', label: 'Always' },
    { value: 'sometimes', label: 'Sometimes' },
    { value: 'rarely', label: 'Rarely' },
    { value: 'never', label: 'Never' },
  ];

  const smokingOptions = [
    { value: 'current', label: 'Current smoker' },
    { value: 'former', label: 'Former smoker' },
    { value: 'never', label: 'Never smoked' },
  ];

  const treatmentOptions = [
    { value: 'otcCreams', label: 'Over-the-counter creams' },
    { value: 'prescription', label: 'Prescription medication' },
    { value: 'steroids', label: 'Steroid creams' },
    { value: 'antihistamines', label: 'Antihistamines' },
    { value: 'moisturizers', label: 'Moisturizers' },
    { value: 'naturalRemedies', label: 'Natural remedies' },
    { value: 'phototherapy', label: 'Light therapy/phototherapy' },
    { value: 'none', label: 'None' },
  ];

  const treatmentEffectOptions = [
    { value: 'improved', label: 'Condition improved significantly' },
    { value: 'slightImprovement', label: 'Slight improvement' },
    { value: 'noEffect', label: 'No noticeable effect' },
    { value: 'worsened', label: 'Condition worsened' },
    { value: 'varied', label: 'Effects varied by treatment' },
  ];

  // Form Steps Definition
  const formSteps = [
    {
      title: 'Duration & Onset',
      description: "Tell us how long you've had these symptoms and how they appeared",
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">How long have you had this skin condition?</Label>
            <RadioGroup
              value={formData.duration}
              onValueChange={(value) => updateFormData('duration', value)}
              className="space-y-3"
            >
              {durationOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={option.value} value={option.value} />
                  <Label htmlFor={option.value} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-lg text-white">Did the symptoms appear suddenly or gradually?</Label>
            <RadioGroup
              value={formData.onset}
              onValueChange={(value) => updateFormData('onset', value)}
              className="space-y-3"
            >
              {onsetOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`onset-${option.value}`} value={option.value} />
                  <Label htmlFor={`onset-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      title: 'Sensations & Intensity',
      description: "Rate the sensations you're experiencing in the affected area",
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">How itchy is the affected area?</Label>
            <div className="flex space-x-2 items-center">
              <span className="text-white/60 text-sm">Not itchy</span>
              <Slider
                value={[formData.itchLevel]}
                onValueChange={(value) => updateFormData('itchLevel', value[0])}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-white/60 text-sm">Very itchy</span>
            </div>
            <div className="text-center text-diagnosphere-primary font-semibold">
              {formData.itchLevel} / 10
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg text-white">How painful is the affected area?</Label>
            <div className="flex space-x-2 items-center">
              <span className="text-white/60 text-sm">No pain</span>
              <Slider
                value={[formData.painLevel]}
                onValueChange={(value) => updateFormData('painLevel', value[0])}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-white/60 text-sm">Very painful</span>
            </div>
            <div className="text-center text-diagnosphere-primary font-semibold">
              {formData.painLevel} / 10
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Do you experience a burning sensation?</Label>
            <div className="flex space-x-2 items-center">
              <span className="text-white/60 text-sm">No burning</span>
              <Slider
                value={[formData.burningLevel]}
                onValueChange={(value) => updateFormData('burningLevel', value[0])}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-white/60 text-sm">Severe burning</span>
            </div>
            <div className="text-center text-diagnosphere-primary font-semibold">
              {formData.burningLevel} / 10
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">How much discomfort do you feel during movement?</Label>
            <div className="flex space-x-2 items-center">
              <span className="text-white/60 text-sm">No discomfort</span>
              <Slider
                value={[formData.movementDiscomfort]}
                onValueChange={(value) => updateFormData('movementDiscomfort', value[0])}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-white/60 text-sm">Severe discomfort</span>
            </div>
            <div className="text-center text-diagnosphere-primary font-semibold">
              {formData.movementDiscomfort} / 10
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Visual Appearance',
      description: 'Describe the visual characteristics of your skin condition',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">Which of the following symptoms do you have? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {symptomOptions.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData[option.id as keyof FormData]
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => updateFormData(option.id as keyof FormData, !formData[option.id as keyof FormData])}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData[option.id as keyof FormData]
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData[option.id as keyof FormData] && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">What color is the affected area?</Label>
            <RadioGroup
              value={formData.skinColor}
              onValueChange={(value) => updateFormData('skinColor', value)}
              className="space-y-3"
            >
              {skinColorOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`color-${option.value}`} value={option.value} />
                  <Label htmlFor={`color-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">What type of borders does the affected area have?</Label>
            <RadioGroup
              value={formData.borderType}
              onValueChange={(value) => updateFormData('borderType', value)}
              className="space-y-3"
            >
              {borderTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`border-${option.value}`} value={option.value} />
                  <Label htmlFor={`border-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                    {option.value === 'irregular' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 ml-2 inline text-white/60" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-60">Irregular borders can be an important characteristic for identifying melanoma.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Is the affected area symmetrical?</Label>
            <RadioGroup
              value={formData.isSymmetrical}
              onValueChange={(value) => updateFormData('isSymmetrical', value)}
              className="space-y-3"
            >
              {symmetryOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`symmetry-${option.value}`} value={option.value} />
                  <Label htmlFor={`symmetry-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                    {option.value === 'asymmetrical' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 ml-2 inline text-white/60" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-60">Asymmetry is one of the warning signs for melanoma.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">How would you describe the texture of the surface? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {surfaceTextureOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData.surfaceTexture.includes(option.value)
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleArrayItem('surfaceTexture', option.value)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData.surfaceTexture.includes(option.value)
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData.surfaceTexture.includes(option.value) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Size & Evolution',
      description: 'Tell us about the size and how the condition has changed over time',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">Approximate size of the affected area</Label>
            <Input
              value={formData.approximateSize}
              onChange={(e) => updateFormData('approximateSize', e.target.value)}
              placeholder="e.g., 1 cm, dime-sized, palm-sized"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Has the size changed over time?</Label>
            <RadioGroup
              value={formData.hasSizeChanged}
              onValueChange={(value) => updateFormData('hasSizeChanged', value)}
              className="space-y-3"
            >
              {sizeChangedOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`size-${option.value}`} value={option.value} />
                  <Label htmlFor={`size-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                    {option.value === 'increased' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 ml-2 inline text-white/60" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-60">Growth over time can be a warning sign for certain skin conditions, including melanoma.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Has the color or shape changed over time?</Label>
            <RadioGroup
              value={formData.hasAppearanceChanged}
              onValueChange={(value) => updateFormData('hasAppearanceChanged', value)}
              className="space-y-3"
            >
              {appearanceChangedOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`appearance-${option.value}`} value={option.value} />
                  <Label htmlFor={`appearance-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                    {(option.value === 'color' || option.value === 'both') && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 ml-2 inline text-white/60" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-60">Color changes can be an important sign to monitor, especially for melanoma.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Has the condition spread since it first appeared?</Label>
            <RadioGroup
              value={formData.hasSpread}
              onValueChange={(value) => updateFormData('hasSpread', value)}
              className="space-y-3"
            >
              {spreadOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`spread-${option.value}`} value={option.value} />
                  <Label htmlFor={`spread-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      title: 'Texture & Physical Feel',
      description: 'Describe how the affected area feels when touched',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">How would you describe the physical feel of the affected area? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {textureOptions.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData[option.id as keyof FormData]
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => updateFormData(option.id as keyof FormData, !formData[option.id as keyof FormData])}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData[option.id as keyof FormData]
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData[option.id as keyof FormData] && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Where on your body is the condition located? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {affectedAreaOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData.affectedAreas.includes(option.value)
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleArrayItem('affectedAreas', option.value)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData.affectedAreas.includes(option.value)
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData.affectedAreas.includes(option.value) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Do you have any nail symptoms? (pitting, ridges, discoloration)</Label>
            <RadioGroup
              value={formData.hasNailSymptoms ? 'yes' : 'no'}
              onValueChange={(value) => updateFormData('hasNailSymptoms', value === 'yes')}
              className="space-y-3"
            >
              {yesNoOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`nails-${option.value}`} value={option.value} />
                  <Label htmlFor={`nails-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                    {option.value === 'yes' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 ml-2 inline text-white/60" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-60">Nail symptoms are often associated with psoriasis.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Do you have any joint pain or stiffness?</Label>
            <RadioGroup
              value={formData.hasJointPain ? 'yes' : 'no'}
              onValueChange={(value) => updateFormData('hasJointPain', value === 'yes')}
              className="space-y-3"
            >
              {yesNoOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`joints-${option.value}`} value={option.value} />
                  <Label htmlFor={`joints-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                    {option.value === 'yes' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 ml-2 inline text-white/60" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-60">Joint symptoms can be associated with psoriatic arthritis, which often accompanies psoriasis.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      title: 'Triggers & Patterns',
      description: 'Identify potential triggers and patterns of your condition',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">Do you notice any triggers that make your condition worse? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {triggerOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData.knownTriggers.includes(option.value)
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleArrayItem('knownTriggers', option.value)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData.knownTriggers.includes(option.value)
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData.knownTriggers.includes(option.value) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Do symptoms get worse in certain environments? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {environmentFactorOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData.environmentFactors.includes(option.value)
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleArrayItem('environmentFactors', option.value)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData.environmentFactors.includes(option.value)
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData.environmentFactors.includes(option.value) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Have you had any recent illnesses or infections?</Label>
            <Textarea
              value={formData.recentIllness}
              onChange={(e) => updateFormData('recentIllness', e.target.value)}
              placeholder="Please describe any recent illnesses or infections"
              className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Medical History',
      description: 'Tell us about your relevant personal and family medical history',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">Do you have a personal history of any of these conditions? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {personalHistoryOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData.personalHistory.includes(option.value)
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleArrayItem('personalHistory', option.value)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData.personalHistory.includes(option.value)
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData.personalHistory.includes(option.value) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Is there a family history of any of these conditions? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {familyHistoryOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData.familyHistory.includes(option.value)
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleArrayItem('familyHistory', option.value)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData.familyHistory.includes(option.value)
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData.familyHistory.includes(option.value) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Environmental Factors',
      description: 'Tell us about environmental factors that may affect your skin',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">How much sun exposure do you typically get?</Label>
            <RadioGroup
              value={formData.sunExposure}
              onValueChange={(value) => updateFormData('sunExposure', value)}
              className="space-y-3"
            >
              {sunExposureOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`sun-${option.value}`} value={option.value} />
                  <Label htmlFor={`sun-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Have you had any recent sunburns (within the last 3 months)?</Label>
            <RadioGroup
              value={formData.recentSunburn}
              onValueChange={(value) => updateFormData('recentSunburn', value)}
              className="space-y-3"
            >
              {yesNoOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`sunburn-${option.value}`} value={option.value} />
                  <Label htmlFor={`sunburn-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">How often do you use sunscreen?</Label>
            <RadioGroup
              value={formData.useSunscreen}
              onValueChange={(value) => updateFormData('useSunscreen', value)}
              className="space-y-3"
            >
              {sunscreenOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`sunscreen-${option.value}`} value={option.value} />
                  <Label htmlFor={`sunscreen-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Do you have any occupational or chemical exposures?</Label>
            <Textarea
              value={formData.chemicalExposure}
              onChange={(e) => updateFormData('chemicalExposure', e.target.value)}
              placeholder="Please describe any chemicals, irritants, or substances you're regularly exposed to"
              className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">Smoking status</Label>
            <RadioGroup
              value={formData.smokingStatus}
              onValueChange={(value) => updateFormData('smokingStatus', value)}
              className="space-y-3"
            >
              {smokingOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`smoking-${option.value}`} value={option.value} />
                  <Label htmlFor={`smoking-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      title: 'Treatment History',
      description: "Tell us about any treatments you've tried",
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg text-white">Have you tried any of these treatments? (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {treatmentOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all cursor-pointer ${
                    formData.previousTreatments.includes(option.value)
                      ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleArrayItem('previousTreatments', option.value)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    formData.previousTreatments.includes(option.value)
                      ? 'bg-diagnosphere-primary text-white'
                      : 'bg-white/10'
                  }`}>
                    {formData.previousTreatments.includes(option.value) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-white">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg text-white">How effective were the treatments you tried?</Label>
            <RadioGroup
              value={formData.treatmentEffects}
              onValueChange={(value) => updateFormData('treatmentEffects', value)}
              className="space-y-3"
            >
              {treatmentEffectOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                  <RadioGroupItem id={`effects-${option.value}`} value={option.value} />
                  <Label htmlFor={`effects-${option.value}`} className="text-white cursor-pointer w-full">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      ),
    },

  ];

  const currentFormStep = formSteps[currentStep];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between mb-8">
        {formSteps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center"
            style={{ width: `${100 / formSteps.length}%` }}
          >
            <div className="relative w-full mb-2">
              <div
                className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-white/10"
                style={{
                  right: index === formSteps.length - 1 ? '50%' : 0,
                  left: index === 0 ? '50%' : 0,
                }}
              />
              <div
                className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-diagnosphere-primary transition-all duration-300 ${
                  index < currentStep ? 'right-0' : index === currentStep ? 'right-1/2' : 'right-full'
                }`}
                style={{
                  right: index === formSteps.length - 1 ? '50%' : 0,
                  left: index === 0 ? '50%' : 0,
                }}
              />
              <div
                className={`relative z-10 mx-auto w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-diagnosphere-primary border-diagnosphere-primary text-white'
                    : index === currentStep
                    ? 'bg-diagnosphere-primary/20 border-diagnosphere-primary text-white'
                    : 'bg-white/5 border-white/20 text-white/50'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
            </div>
            <span
              className={`text-xs text-center mt-1 ${
                index === currentStep ? 'text-diagnosphere-primary font-medium' : 'text-white/50'
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-lg">
        <h2 className="text-2xl font-semibold text-white mb-2">{currentFormStep.title}</h2>
        <p className="text-white/70 mb-6">{currentFormStep.description}</p>

        {/* Display prediction result if available */}
        {(() => {
          try {
            return prediction && (
              <div className="mb-6 p-4 bg-diagnosphere-primary/10 border border-diagnosphere-primary/30 rounded-lg">
                <h3 className="font-medium text-diagnosphere-primary mb-2">AI Analysis Result:</h3>
                <p className="text-white">
                  <span className="font-semibold">{prediction.prediction || 'Unknown'}</span> detected with {typeof prediction.confidence === 'number' ? prediction.confidence.toFixed(2) : '0.00'}% confidence
                </p>
              </div>
            );
          } catch (error) {
            console.error('Error displaying prediction:', error);
            return null;
          }
        })()}

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {currentFormStep.content}
        </motion.div>

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            onClick={handleBack}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5"
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="bg-diagnosphere-primary hover:bg-diagnosphere-primary/90"
          >
            {currentStep === formSteps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisForm;