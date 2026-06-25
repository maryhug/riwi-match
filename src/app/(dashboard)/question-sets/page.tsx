'use client';

import Link from 'next/link';
import { Plus, FileText, Mic } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { questionSetsApi } from '@/lib/api';
import type { QuestionSet } from '@/lib/types';

export default function QuestionSetsPage() {
  const { data: sets = [], isLoading } = useQuery({
    queryKey: ['question-sets'],
    queryFn: () => questionSetsApi.list().then((r) => r.data),
  });

  return (
    <div className="space-y-5">
      <Header title="Sets de preguntas" subtitle="Plantillas de profiling automatizado por cargo.">
        <Link
          href="/question-sets/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-md bg-violet-600 hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo set
        </Link>
      </Header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center">
            <Mic className="w-6 h-6 text-violet-600" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">Sin sets de preguntas</p>
          <p className="text-xs text-slate-400 text-center max-w-xs">
            Crea un set de preguntas para usarlo en el profiling de voz de tus candidatos.
          </p>
          <Link
            href="/question-sets/new"
            className="mt-2 px-4 py-1.5 text-xs font-semibold text-white rounded-md bg-violet-600 hover:bg-violet-700 transition-colors"
          >
            Crear primer set
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set: QuestionSet) => (
            <Link key={set.id} href={`/question-sets/${set.id}`}>
              <div
                className="bg-white rounded-lg p-5 flex flex-col h-full cursor-pointer hover:shadow-md transition-shadow"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] font-bold text-violet-700 px-1.5 py-0.5 bg-violet-50 rounded">
                      v{set.version}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      set.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : set.status === 'DRAFT'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {set.status === 'ACTIVE' ? 'Activo' : set.status === 'DRAFT' ? 'Borrador' : 'Archivado'}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 text-sm mb-2">{set.name}</h3>
                {set.description && (
                  <p className="text-xs text-slate-500 mb-3 flex-1 leading-relaxed">{set.description}</p>
                )}
                <p className="text-xs text-slate-400 font-medium mt-auto">
                  {set.questions?.length ?? 0} preguntas
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
