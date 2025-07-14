import { notFound } from 'next/navigation'
import InteractionClient from './InteractionClient'
import { Suspense } from 'react'

export async function generateStaticParams() {
  return [{ vault: 'r' }]
}

export default function VaultPage() {
  return (
    <Suspense>
      <InteractionClient />
    </Suspense>
  )
}
