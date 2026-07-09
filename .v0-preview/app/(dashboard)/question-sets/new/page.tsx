'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/riwi/button'
import { Card } from '@/components/riwi/card'
import { Input, Textarea } from '@/components/riwi/form'
import { Header } from '@/components/riwi/header'
import { QuestionBuilder, emptyQuestion } from '@/components/riwi/question-builder'
import { questionSetsApi } from '@/lib/api'
import type { ProfilingQuestion } from '@/lib/types'

export default function NewQuestionSetPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<ProfilingQuestion[]>([emptyQuestion(1)])
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () => questionSetsApi.create({ name, description: description || undefined, questions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-sets'] })
      router.push('/question-sets')
    },
    onError: (err) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || 'No se pudo crear el set. Intenta de nuevo.')
    },
  })

  const create = () => {
    if (!name.trim()) {
      setError('El nombre del set es obligatorio')
      return
    }
    if (questions.length === 0 || questions.some((q) => !q.text.trim())) {
      setError('Todas las preguntas deben tener texto y debe haber al menos una')
      return
    }
    setError('')
    createMutation.mutate()
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <Header title="Nuevo set de preguntas" subtitle="Diseña las preguntas de la llamada de profiling" />

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <Input
            label="Nombre del set"
            placeholder="Ej: Backend Senior — screening técnico"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            label="Descripción (opcional)"
            placeholder="¿Para qué tipo de vacantes es este set?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20"
          />
        </Card>

        <QuestionBuilder questions={questions} onChange={setQuestions} />

        {error && (
          <p className="rounded-[10px] bg-coral-light px-3 py-2 text-[11px] font-medium text-coral">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={create} loading={createMutation.isPending}>
            Crear set
          </Button>
        </div>
      </div>
    </div>
  )
}
