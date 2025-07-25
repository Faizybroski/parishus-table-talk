import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface DietaryPreferencesStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const DIETARY_OPTIONS = [
  { id: 'vegetarian', name: 'Vegetarian', description: 'No meat or fish' },
  { id: 'vegan', name: 'Vegan', description: 'No animal products' },
  { id: 'gluten_free', name: 'Gluten-Free', description: 'No gluten-containing foods' },
  { id: 'dairy_free', name: 'Dairy-Free', description: 'No dairy products' },
  { id: 'keto', name: 'Keto', description: 'Low-carb, high-fat diet' },
  { id: 'paleo', name: 'Paleo', description: 'Whole foods, no processed items' },
  { id: 'halal', name: 'Halal', description: 'Islamic dietary laws' },
  { id: 'kosher', name: 'Kosher', description: 'Jewish dietary laws' },
  { id: 'no_restrictions', name: 'No Restrictions', description: 'I eat everything!' }
];

export const DietaryPreferencesStep: React.FC<DietaryPreferencesStepProps> = ({ data, updateData }) => {
  const togglePreference = (preference: string) => {
    const currentPreferences = data.dietary_preferences || [];
    
    if (preference === 'no_restrictions') {
      updateData('dietary_preferences', ['no_restrictions']);
      return;
    }
    
    let newPreferences;
    if (currentPreferences.includes(preference)) {
      newPreferences = currentPreferences.filter((p: string) => p !== preference);
    } else {
      newPreferences = [...currentPreferences.filter((p: string) => p !== 'no_restrictions'), preference];
    }
    
    updateData('dietary_preferences', newPreferences);
  };

  const isSelected = (preference: string) => {
    return (data.dietary_preferences || []).includes(preference);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Dietary Preferences</h2>
        <p className="text-muted-foreground">
          Select any dietary restrictions or preferences you have
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DIETARY_OPTIONS.map((option) => {
          const selected = isSelected(option.id);
          
          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all hover:shadow-card ${
                selected 
                  ? 'border-sage-green bg-sage-green/10' 
                  : 'border-border hover:border-sage-green/50'
              }`}
              onClick={() => togglePreference(option.id)}
            >
              <CardContent className="p-3 flex items-center space-x-3">
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                  selected 
                    ? 'border-sage-green bg-sage-green text-white' 
                    : 'border-muted-foreground'
                }`}>
                  {selected && <Check className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{option.name}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};