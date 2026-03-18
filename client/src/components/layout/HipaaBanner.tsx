import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function HipaaBanner() {
  return (
    <Alert variant="warning" className="mb-6 border-amber-300 bg-amber-50" role="note" aria-label="Privacy notice">
      <ShieldCheck className="h-4 w-4 !text-amber-600" aria-hidden="true" />
      <AlertDescription className="text-amber-900 text-sm">
        <strong>Your data never leaves this session.</strong>{' '}
        HealthLens does not store, share, or transmit your lab reports to any database.
        Files are processed transiently in memory and discarded immediately after analysis.
        This service is designed with HIPAA privacy principles in mind.{' '}
        <strong>This is not medical advice.</strong> Always consult your healthcare provider.
      </AlertDescription>
    </Alert>
  );
}
