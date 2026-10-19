import React, { useState } from 'react'
import {
  Stethoscope,
  Leaf,
  Bug,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react'

type DiagnosisItem = {
  cropFamily: string
  symptom: string
  diseaseName: string
  organicRemedy: string
  preventiveAction: string
  philippineOrganicCode: string
}

const DIAGNOSES: DiagnosisItem[] = [
  {
    cropFamily: 'Solanaceous (Eggplant, Tomato, Pepper)',
    symptom: 'Fruit borer holes & dropping fruit',
    diseaseName: 'Eggplant Fruit & Shoot Borer (Leucinodes orbonalis)',
    organicRemedy: 'Spray Bacillus thuringiensis (Bt) or neem oil extract (5ml/L) at sunset. Handpick and destroy infested shoots.',
    preventiveAction: 'Intercrop with coriander or marigold to attract natural beneficial predatory wasps.',
    philippineOrganicCode: 'PNS/BAFS 07:2016 Compliant Organic Botanical',
  },
  {
    cropFamily: 'Solanaceous (Eggplant, Tomato, Pepper)',
    symptom: 'Sudden daytime wilting while leaves remain green',
    diseaseName: 'Bacterial Wilt (Ralstonia solanacearum)',
    organicRemedy: 'Drench root zone with Trichoderma harzianum bio-fungicide and compost tea to outcompete pathogen.',
    preventiveAction: 'Rotate fields with non-host crops like corn or upland rice for at least 2 seasons.',
    philippineOrganicCode: 'Biological Control Agent (BCA)',
  },
  {
    cropFamily: 'Grains & Cereals (Rice, Corn)',
    symptom: 'Whiteheads or deadhearts on tillers',
    diseaseName: 'Yellow Stem Borer (Scirpophaga incertulas)',
    organicRemedy: 'Release Trichogramma japonicum egg parasitoid cards (50 cards/ha) at 25 and 35 days after transplanting.',
    preventiveAction: 'Synchronized planting with neighboring farms and avoid excessive nitrogen application.',
    philippineOrganicCode: 'PhilRice Bio-Agent Protocol',
  },
  {
    cropFamily: 'Leafy Greens (Lettuce, Pechay, Mustard)',
    symptom: 'Curled leaves with sticky honeydew & black sooty mold',
    diseaseName: 'Aphid & Whitefly Infestation',
    organicRemedy: 'Spray mild liquid castile soap solution with chili (siling labuyo) extract (10 crushed peppers in 1L water + 1 tbsp soap).',
    preventiveAction: 'Install yellow sticky traps 30cm above crop canopy.',
    philippineOrganicCode: 'Traditional Botanical Pest Repellent',
  },
  {
    cropFamily: 'Cucurbits (Squash, Ampalaya, Cucumber)',
    symptom: 'Yellow angular patches on leaf surface with gray fuzz below',
    diseaseName: 'Downy Mildew (Pseudoperonospora cubensis)',
    organicRemedy: 'Apply baking soda spray (1 tbsp baking soda + 1 tsp horticultural oil per gallon of water) in early morning.',
    preventiveAction: 'Provide trellis support to elevate vines off wet soil and improve air circulation.',
    philippineOrganicCode: 'Approved Organic Fungistat',
  },
  {
    cropFamily: 'Fruit Trees (Mango, Banana, Papaya)',
    symptom: 'Dark sunken circular lesions on ripening fruit',
    diseaseName: 'Anthracnose (Colletotrichum gloeosporioides)',
    organicRemedy: 'Post-harvest Hot Water Treatment (HWT) at 52–55°C for 10 minutes to eradicate fungal spores without chemicals.',
    preventiveAction: 'Prune dead twigs after harvest to allow maximum sunlight penetration into the tree canopy.',
    philippineOrganicCode: 'BPI Post-Harvest Standard Protocol',
  },
]

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const CropDoctorModal = ({ isOpen, onClose }: Props) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('All')
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisItem>(DIAGNOSES[0])

  if (!isOpen) return null

  const filteredDiagnoses = DIAGNOSES.filter((d) => {
    if (selectedFamily !== 'All' && !d.cropFamily.includes(selectedFamily)) return false
    return true
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 animate-scale-up overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-800 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300">
              <Stethoscope className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">AgriMarket Crop Doctor & Organic Advisory</h2>
              <p className="text-xs text-teal-100">
                Pest and disease diagnosis aligned with Philippine Organic Standards (RA 10068)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-gray-500">Crop Family:</span>
          {['All', 'Solanaceous', 'Grains', 'Leafy', 'Cucurbits', 'Fruit Trees'].map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setSelectedFamily(fam)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                selectedFamily === fam
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {fam}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Select Observed Field Symptom:
          </label>

          <div className="grid sm:grid-cols-2 gap-2.5">
            {filteredDiagnoses.map((item) => {
              const isSelected = selectedDiagnosis.diseaseName === item.diseaseName
              return (
                <div
                  key={item.diseaseName}
                  onClick={() => setSelectedDiagnosis(item)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition space-y-1 ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">
                    {item.cropFamily.split('(')[0]}
                  </span>
                  <p className="font-extrabold text-xs text-gray-900">{item.symptom}</p>
                  <p className="text-[11px] text-gray-500 italic">{item.diseaseName}</p>
                </div>
              )
            })}
          </div>

          {/* Detailed Diagnosis & Organic Treatment Prescription */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/70 to-emerald-50/70 border border-teal-200 space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-teal-800 tracking-wider">
                  Organic Diagnosis & Prescription
                </span>
                <h4 className="text-base font-extrabold text-gray-900">{selectedDiagnosis.diseaseName}</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% Non-Toxic
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/90 border border-teal-100 space-y-1">
                <p className="font-bold text-teal-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-teal-700" />
                  Recommended Organic Remedy:
                </p>
                <p className="text-gray-700 leading-relaxed">{selectedDiagnosis.organicRemedy}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-teal-100 space-y-1">
                <p className="font-bold text-teal-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Preventive Cultural Practice:
                </p>
                <p className="text-gray-700 leading-relaxed">{selectedDiagnosis.preventiveAction}</p>
              </div>
            </div>

            <p className="text-[10px] text-teal-700 font-bold text-right pt-1">
              Accreditation: {selectedDiagnosis.philippineOrganicCode}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 shrink-0">
          <span>Compliant with DA Bureau of Agriculture and Fisheries Standards.</span>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary py-1.5 px-4 text-xs font-bold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  )
}

export default CropDoctorModal
