import React from 'react'
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  FileCheck,
  Calendar,
  Building,
  Sparkles,
  QrCode,
} from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  farmName?: string
  location?: string
  isOrganic?: boolean
}

export const GapCertificationModal = ({
  isOpen,
  onClose,
  farmName = 'Green Valley Farm',
  location = 'Polomolok, South Cotabato',
  isOrganic = true,
}: Props) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-scale-up space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">PhilGAP & Organic Compliance Verification</h3>
              <p className="text-xs text-gray-500">Official Philippine Agricultural Standards (PNS)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Certificate Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-300 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                Verified Accreditation
              </span>
              <h4 className="text-lg font-black text-gray-900 mt-1">{farmName}</h4>
              <p className="text-xs text-gray-600">{location}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="h-7 w-7" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500">PhilGAP Serial:</span>
              <p className="font-extrabold text-gray-900">GAP-XII-2026-0842</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500">Valid Through:</span>
              <p className="font-extrabold text-emerald-800">December 2027</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500">Auditing Body:</span>
              <p className="font-bold text-gray-800">DA RFO-XII / BAFS</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500">Standard:</span>
              <p className="font-bold text-gray-800">PNS/BAFS 140:2020</p>
            </div>
          </div>
        </div>

        {/* Audit Parameters Checklist */}
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            Verified Food Safety Parameters:
          </p>

          <div className="grid gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-gray-900">Zero Toxic Chemical Residue:</strong>
                <span className="text-gray-600 ml-1">Passed laboratory multi-residue gas chromatography screening.</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-gray-900">Microbial Irrigation Testing:</strong>
                <span className="text-gray-600 ml-1">Mountain spring & deep well water verified free from E. coli / Coliforms.</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-gray-900">Organic Soil Stewardship:</strong>
                <span className="text-gray-600 ml-1">Enriched via vermicast, fermented plant juice, and zero synthetic urea.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-gray-400">Department of Agriculture Region XII</span>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary py-2 px-5 text-xs font-bold"
          >
            Close Accreditation
          </button>
        </div>
      </div>
    </div>
  )
}

export default GapCertificationModal
