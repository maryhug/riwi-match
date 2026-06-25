'use client';

import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Header from '@/components/layout/Header';

const SETS = [
  {
    id: 1,
    name: 'Profiling Backend Sr v2',
    version: 'v2',
    status: 'Activo',
    desc: 'Set estándar para perfiles backend senior — incluye disponibilidad híbrida y motivaciones.',
    details: '6 preguntas · Español · Backend Sr',
    used: true,
  },
  {
    id: 2,
    name: 'Profiling Diseño v1',
    version: 'v1',
    status: 'Activo',
    desc: 'Profiling para roles de Product Design — afinidad con producto y proceso.',
    details: '5 preguntas · Español · Product Designer',
    used: true,
  },
  {
    id: 3,
    name: 'Profiling Comercial Jr',
    version: 'v1',
    status: 'Borrador',
    desc: 'Borrador inicial para perfiles comerciales junior.',
    details: '4 preguntas · Español · Account Manager',
    used: false,
  },
];

export default function QuestionSetsPage() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {SETS.map((set) => (
          <Link key={set.id} href={`/question-sets/${set.id}`}>
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer h-full flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-dark" />
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-primary-dark px-2 py-0.5 bg-primary-xlight rounded">
                      {set.version}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      set.status === 'Activo' ? 'bg-mint-light text-mint' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {set.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 text-base mb-2">{set.name}</h3>
                <p className="text-sm text-slate-600 mb-4 flex-1 leading-relaxed">{set.desc}</p>
                <p className="text-xs text-slate-400 font-medium mb-4">{set.details}</p>

                {set.used && (
                  <div className="bg-orange-50/80 rounded-lg px-3 py-2 mt-auto">
                    <p className="text-[10px] font-medium text-orange-600">
                      Este set ya fue usado en procesos — editar creará una nueva versión.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
