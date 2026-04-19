"use client";

import {
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  FileUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const contractDocs = [
  {
    label: "Contrat d'alternance",
    status: "valid",
    date: "01/09/2025",
    expiry: "31/08/2026",
    file: "contrat_alternance_2025.pdf",
  },
  {
    label: "Convention de formation",
    status: "valid",
    date: "01/09/2025",
    expiry: "31/08/2026",
    file: "convention_2025.pdf",
  },
  {
    label: "Avenant au contrat",
    status: "missing",
    date: null,
    expiry: null,
    file: null,
  },
];

const officialDocs = [
  { name: "Certificat de scolarité 2025-2026", date: "01/09/2025", size: "124 Ko", icon: "📄" },
  { name: "Relevé de notes S9", date: "15/02/2026", size: "87 Ko", icon: "📊" },
  { name: "Attestation d'assiduité", date: "10/04/2026", size: "65 Ko", icon: "✅" },
  { name: "Carte étudiant 2025-2026", date: "01/09/2025", size: "2.1 Mo", icon: "🪪" },
];

const myDocs = [
  { name: "CV_LucasMartin_2026.pdf", date: "01/03/2026", size: "340 Ko", status: "validated" },
  { name: "Lettre_motivation.pdf", date: "01/03/2026", size: "128 Ko", status: "validated" },
  { name: "Diplome_BAC.pdf", date: "15/09/2025", size: "1.2 Mo", status: "validated" },
  { name: "Photo_identite.jpg", date: "15/09/2025", size: "540 Ko", status: "validated" },
];

const statusConfig = {
  valid: { label: "Valide", icon: CheckCircle, className: "text-green-600", bg: "bg-green-50" },
  expiring: { label: "Expire bientôt", icon: AlertCircle, className: "text-orange-600", bg: "bg-orange-50" },
  missing: { label: "Manquant", icon: AlertCircle, className: "text-red-600", bg: "bg-red-50" },
  validated: { label: "Validé", icon: CheckCircle, className: "text-green-600", bg: "bg-green-50" },
  pending: { label: "En attente", icon: Clock, className: "text-orange-600", bg: "bg-orange-50" },
};

export default function DocumentsEtudiant() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Alert */}
      <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm">
        <AlertCircle size={16} className="text-orange-500 flex-shrink-0" />
        <span className="text-orange-800 font-medium">
          1 document manquant dans votre dossier : <strong>Avenant au contrat</strong>. Veuillez le déposer dès que possible.
        </span>
      </div>

      {/* Contracts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h3 className="font-bold text-sm text-gray-900">Documents d'alternance</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {contractDocs.map((doc, i) => {
            const s = statusConfig[doc.status as keyof typeof statusConfig];
            const SIcon = s.icon;
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                  <FileText size={18} className={s.className} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{doc.label}</div>
                  {doc.date && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Signé le {doc.date}
                      {doc.expiry && (
                        <span className="ml-2">· Expire le {doc.expiry}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", s.bg, s.className)}>
                    <SIcon size={11} /> {s.label}
                  </span>
                  {doc.file ? (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download size={12} /> Télécharger
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowUpload(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#001944] rounded-lg hover:bg-[#002C6E] transition-colors"
                    >
                      <Upload size={12} /> Déposer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official docs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h3 className="font-bold text-sm text-gray-900">Documents officiels</h3>
          <span className="text-xs text-gray-400">Générés par l'administration</span>
        </div>
        <div className="divide-y divide-gray-50">
          {officialDocs.map((doc, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
              <span className="text-xl flex-shrink-0">{doc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800">{doc.name}</div>
                <div className="text-xs text-gray-400">{doc.date} · {doc.size}</div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                <Download size={12} /> Télécharger
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* My docs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h3 className="font-bold text-sm text-gray-900">Mes documents personnels</h3>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001944] text-white text-xs font-semibold rounded-lg hover:bg-[#002C6E] transition-colors"
          >
            <Upload size={12} /> Ajouter
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {myDocs.map((doc, i) => {
            const s = statusConfig[doc.status as keyof typeof statusConfig];
            const SIcon = s.icon;
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800 truncate">{doc.name}</div>
                  <div className="text-xs text-gray-400">{doc.date} · {doc.size}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("flex items-center gap-1 text-xs font-medium", s.className)}>
                    <SIcon size={11} /> {s.label}
                  </span>
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Déposer un document</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Type de document</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                  <option>Avenant au contrat</option>
                  <option>Justificatif d'identité</option>
                  <option>Diplôme</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer">
                <FileUp size={28} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">Glisser-déposer votre fichier ici</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10 Mo</p>
                <button className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Parcourir les fichiers
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E]"
              >
                Déposer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
