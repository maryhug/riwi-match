'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GripVertical, Trash2, Star, Edit2, Plus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

type Question = {
  id: number;
  type: string;
  critical: boolean;
  text: string;
  weight: number;
  positiveKeywords: string[];
  rejectKeywords: string[];
};

const INITIAL_QUESTIONS: Question[] = [
  { id: 1, type: 'Abierta', critical: true, text: '¿Tienes disponibilidad para modalidad híbrida en Medellín?', weight: 30, positiveKeywords: ['disponible', 'sí', 'aceptado'], rejectKeywords: ['conflicto', 'desplazo', 'demanda'] },
  { id: 2, type: 'Abierta', critical: false, text: 'Cuéntanos por qué saliste de tu último empleo', weight: 20, positiveKeywords: ['crecimiento', 'reto', 'oportunidad'], rejectKeywords: ['despido', 'problema', 'jefe'] },
  { id: 3, type: 'Numérica', critical: false, text: '¿Cuál es tu expectativa salarial?', weight: 15, positiveKeywords: [], rejectKeywords: [] },
  { id: 4, type: 'Numérica', critical: true, text: '¿Cuántos años de experiencia tienes con Node.js?', weight: 20, positiveKeywords: [], rejectKeywords: [] },
  { id: 5, type: 'Abierta', critical: false, text: '¿Has liderado equipos? ¿De qué tamaño?', weight: 10, positiveKeywords: ['lideré', 'equipo', 'personas'], rejectKeywords: ['nunca', 'no'] },
  { id: 6, type: 'Abierta', critical: true, text: '¿Tu inglés es B2 o superior?', weight: 5, positiveKeywords: ['b2', 'c1', 'fluido'], rejectKeywords: ['básico', 'a2', 'no'] },
];

function KeywordInput({ 
  label, 
  value, 
  onChange, 
  dictionary,
  colorScheme 
}: { 
  label: string;
  value: string[];
  onChange: (newVal: string[]) => void;
  dictionary: string[];
  colorScheme: 'emerald' | 'orange';
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestions = dictionary.filter(w => 
    w.toLowerCase().includes(inputValue.toLowerCase()) && 
    !value.includes(w)
  );

  const handleAdd = (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  const handleRemove = (word: string) => {
    onChange(value.filter(w => w !== word));
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(kw => (
          <span 
            key={kw} 
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
              colorScheme === 'emerald' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-orange-50 text-orange-600 border-orange-100'
            }`}
          >
            {kw}
            <button type="button" onClick={() => handleRemove(kw)} className="hover:text-slate-900 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input 
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Escribe y presiona Enter o , (coma)"
          className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        {showSuggestions && inputValue && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map(s => (
              <div 
                key={s} 
                onClick={() => handleAdd(s)}
                className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 cursor-pointer transition-colors"
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuestionSetDetailPage() {
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  
  // Diccionario global simulado (base de datos)
  const [globalDictionary, setGlobalDictionary] = useState<string[]>([
    'disponible', 'sí', 'aceptado', 'conflicto', 'desplazo', 'demanda', 
    'crecimiento', 'reto', 'oportunidad', 'despido', 'problema', 'jefe',
    'lideré', 'equipo', 'personas', 'nunca', 'no', 'b2', 'c1', 'fluido', 'básico', 'a2'
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State
  const [text, setText] = useState('');
  const [type, setType] = useState('Abierta');
  const [weight, setWeight] = useState(10);
  const [critical, setCritical] = useState(false);
  const [positiveKeywords, setPositiveKeywords] = useState<string[]>([]);
  const [rejectKeywords, setRejectKeywords] = useState<string[]>([]);

  const handleDelete = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleOpenNew = () => {
    setEditingQuestion(null);
    setText('');
    setType('Abierta');
    setWeight(10);
    setCritical(false);
    setPositiveKeywords([]);
    setRejectKeywords([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setText(q.text);
    setType(q.type);
    setWeight(q.weight);
    setCritical(q.critical);
    setPositiveKeywords(q.positiveKeywords);
    setRejectKeywords(q.rejectKeywords);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!text.trim()) return;

    // Actualizar diccionario global con las nuevas palabras ingresadas
    const allFormKeywords = [...positiveKeywords, ...rejectKeywords];
    const newKeywordsToDictionary = allFormKeywords.filter(kw => !globalDictionary.includes(kw));
    
    if (newKeywordsToDictionary.length > 0) {
      setGlobalDictionary([...globalDictionary, ...newKeywordsToDictionary]);
    }
    
    if (editingQuestion) {
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id 
          ? { ...q, text, type, weight, critical, positiveKeywords, rejectKeywords }
          : q
      ));
    } else {
      const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
      setQuestions([...questions, { id: newId, text, type, weight, critical, positiveKeywords, rejectKeywords }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="pt-2 pb-6 border-b border-slate-100 mb-6">
        <Link href="/question-sets" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver a sets
        </Link>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E1B4B' }}>Profiling Backend Sr v2</h1>
        <p className="text-sm text-slate-500">Editor de preguntas - arrastra para reordenar.</p>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, index) => (
          <Card key={q.id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl overflow-hidden group">
            <CardContent className="p-0 flex items-stretch">
              
              {/* Drag Handle */}
              <div className="w-10 flex items-center justify-center bg-slate-50/50 border-r border-slate-100 cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-400 transition-colors">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      PREGUNTA {index + 1}
                    </span>
                    <span className="text-[10px] font-bold text-violet-600 px-2 py-0.5 bg-violet-50 rounded">
                      {q.type}
                    </span>
                    {q.critical && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 px-2 py-0.5 bg-orange-50 rounded">
                        <Star className="w-3 h-3 fill-orange-600" />
                        Crítica
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-slate-900">
                      Peso: {q.weight}%
                    </span>
                    <button 
                      onClick={() => handleOpenEdit(q)}
                      className="text-slate-300 hover:text-violet-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(q.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-medium text-slate-900 mb-4">{q.text}</h3>

                {/* Keywords area */}
                <div className="space-y-2">
                  {q.positiveKeywords.length > 0 && (
                    <div className="flex items-center gap-3 text-[10px] font-medium">
                      <span className="text-slate-400">Keywords positivas:</span>
                      <div className="flex gap-2">
                        {q.positiveKeywords.map(kw => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {q.rejectKeywords.length > 0 && (
                    <div className="flex items-center gap-3 text-[10px] font-medium">
                      <span className="text-slate-400">Keywords que descartan:</span>
                      <div className="flex gap-2">
                        {q.rejectKeywords.map(kw => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 mt-4">
                  Las palabras clave no descartan automáticamente al candidato, activan revisión humana.
                </p>

              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            No hay preguntas en este set.
          </div>
        )}
      </div>

      {/* Add New Question Button */}
      <div className="pt-4">
        <button 
          onClick={handleOpenNew}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50/50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Nueva pregunta
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl my-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-semibold text-slate-900">
                {editingQuestion ? 'Editar pregunta' : 'Nueva pregunta'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pregunta</label>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ej. ¿Cuántos años de experiencia tienes?"
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tipo</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Abierta">Abierta</option>
                    <option value="Numérica">Numérica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Peso (%)</label>
                  <input 
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {type === 'Abierta' && (
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <KeywordInput 
                    label="Keywords positivas" 
                    value={positiveKeywords} 
                    onChange={setPositiveKeywords} 
                    dictionary={globalDictionary}
                    colorScheme="emerald"
                  />
                  <KeywordInput 
                    label="Keywords que descartan" 
                    value={rejectKeywords} 
                    onChange={setRejectKeywords} 
                    dictionary={globalDictionary}
                    colorScheme="orange"
                  />
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={critical}
                    onChange={(e) => setCritical(e.target.checked)}
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-slate-900">Pregunta crítica (Dealbreaker)</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Si el candidato falla esta pregunta, será descartado automáticamente o requerirá revisión urgente.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-sm"
              >
                Guardar pregunta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
