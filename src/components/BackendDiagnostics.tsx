import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { runDiagnostics, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase-health';

export default function BackendDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics = await runDiagnostics();
    setResults(diagnostics);
    setIsRunning(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Backend Diagnostics</CardTitle>
          <CardDescription>
            Run comprehensive tests to identify configuration issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleRunDiagnostics} disabled={isRunning} className="w-full">
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Diagnostics
          </Button>

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <DiagnosticItem 
                  label="Project ID" 
                  status={!!results.projectId}
                  value={results.projectId}
                />
                <DiagnosticItem 
                  label="Anon Key Present" 
                  status={results.anonKeyPresent}
                />
                <DiagnosticItem 
                  label="Anon Key Valid" 
                  status={results.anonKeyValid}
                />
                <DiagnosticItem 
                  label="Network Connectivity" 
                  status={results.networkConnectivity}
                />
                <DiagnosticItem 
                  label="Authentication" 
                  status={results.authenticationWorking}
                />
                <DiagnosticItem 
                  label="Tables Exist" 
                  status={results.tablesExist}
                />
              </div>

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-2">Issues Found:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {results.errors.map((error: string, i: number) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Configuration Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs font-medium mb-1">Supabase URL:</div>
                    <code className="text-xs bg-background p-2 rounded block break-all">
                      {SUPABASE_URL}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1 flex items-center justify-between">
                      <span>Anon Key:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(SUPABASE_ANON_KEY)}
                        className="h-6"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <code className="text-xs bg-background p-2 rounded block break-all">
                      {SUPABASE_ANON_KEY}
                    </code>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertDescription className="text-xs space-y-2">
                  <div className="font-semibold">Troubleshooting Tips:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verify the anon key matches your Supabase project settings</li>
                    <li>Check that the project URL is correct</li>
                    <li>Ensure you've run the database setup SQL in Lovable Cloud</li>
                    <li>Confirm your network allows connections to supabase.co</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DiagnosticItem({ 
  label, 
  status, 
  value 
}: { 
  label: string; 
  status: boolean; 
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        {status ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      {value && (
        <Badge variant="secondary" className="text-xs">
          {value}
        </Badge>
      )}
    </div>
  );
}
