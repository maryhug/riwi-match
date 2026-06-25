'use client';

import Link from 'next/link';
import { Plus, FileText, Mic } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/Card';
import Header from '@/components/layout/Header';
import { questionSetsApi } from '@/lib/api';
import type { QuestionSet } from '@/lib/types';

export default function QuestionSetsPage() {
  const { data: sets = [], isLoading } = useQuery({
    queryKey: ['question-sets'],
    queryFn: () => questionSetsApi.list().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <Header title="Sets de preguntas" subtitle="Plantillas de profiling automatizado por cargo.">
        <Link
          href="/question-sets/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-full shadow-sm transition-colors"
          style={{ background: '#957DF3' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo set
        </Link>
      </Header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center">
            <Mic className="w-7 h-7 text-primary-dark" />
          </div>
          <p className="font-semibold text-slate-700">Sin sets de preguntas</p>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            Crea un set de preguntas para usarlo en el profiling de voz de tus candidatos.
          </p>
          <Link
            href="/question-sets/new"
            className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-full"
            style={{ background: '#957DF3' }}
          >
            Crear primer set
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {sets.map((set: QuestionSet) => (
            <Link key={set.id} href={`/question-sets/${set.id}`}>
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer h-full flex flex-col">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-dark" />
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-primary-dark px-2 py-0.5 bg-primary-xlight rounded">
                        v{set.version}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        set.status === 'ACTIVE'
                          ? 'bg-mint-light text-mint'
                          : set.status === 'DRAFT'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {set.status === 'ACTIVE' ? 'Activo' : set.status === 'DRAFT' ? 'Borrador' : 'Archivado'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-base mb-2">{set.name}</h3>
                  {set.description && (
                    <p className="text-sm text-slate-600 mb-4 flex-1 leading-relaxed">{set.description}</p>
                  )}
                  <p className="text-xs text-slate-400 font-medium mt-auto">
                    {set.questions?.length ?? 0} preguntas
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
