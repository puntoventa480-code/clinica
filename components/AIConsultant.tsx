
import React, { useState } from 'react';
import { analyzeDentalCase } from '../services/geminiService';
import { Icons } from '../constants';

const AIConsultant: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [history, setHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms) return;
    setLoading(true);
    const historyArray = history.split(',').map(s => s.trim());
    const analysis = await analyzeDentalCase(symptoms, historyArray);
    setResult(analysis);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <span className="p-2 bg-sky-100 text-sky-600 rounded-xl"><Icons.Brain /></span>
          Asistente de Diagnóstico IA
        </h1>
        <p className="text-slate-500 mt-2">Introduce los síntomas y antecedentes para obtener sugerencias de tratamiento potenciadas por Gemini 3 Flash.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Síntomas Actuales</label>
            <textarea 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Ej: Dolor punzante en el molar inferior derecho, sensibilidad extrema al frío, inflamación de encía..."
              className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none text-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Antecedentes Clínicos (opcional)</label>
            <input 
              type="text"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Ej: Endodoncia previa, Diabetes tipo II, fumador..."
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none text-slate-600"
            />
            <p className="text-xs text-slate-400 mt-2 italic">Separa los antecedentes con comas.</p>
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={loading || !symptoms}
            className="w-full py-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-sky-100 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analizando con Gemini...
                </>
            ) : 'Generar Análisis Clínico'}
          </button>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-slate-100 overflow-y-auto max-h-[600px] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sky-400">Insights de la IA</h3>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Respuesta del Modelo</span>
          </div>
          {result ? (
            <div className="prose prose-invert prose-sm">
              <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                {result}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-20">
              <Icons.Brain />
              <p className="mt-4">El análisis aparecerá aquí después de procesar los datos.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start space-x-3">
        <div className="text-amber-500 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Aviso Importante:</strong> Esta herramienta de IA es un complemento informativo para el profesional de la salud. Los resultados son sugerencias basadas en modelos de lenguaje y no sustituyen el juicio clínico, diagnóstico físico o radiográfico realizado por un dentista colegiado.
        </p>
      </div>
    </div>
  );
};

export default AIConsultant;
