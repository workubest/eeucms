import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { checkBackendHealth } from '@/lib/supabase-health';
import BackendDiagnostics from './BackendDiagnostics';

export default function SetupGuide() {
  const [isChecking, setIsChecking] = useState(true);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'diagnostics'>('status');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    const result = await checkBackendHealth();
    setBackendStatus(result);
    setIsChecking(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">EEU System Setup</CardTitle>
              <CardDescription>Backend configuration and status</CardDescription>
            </div>
            {backendStatus && (
              <Badge variant={backendStatus.isHealthy ? "default" : "destructive"}>
                {backendStatus.isHealthy ? "Online" : "Offline"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tab Buttons */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'status'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Status
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'diagnostics'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Diagnostics
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'status' ? (
            <>
              {isChecking ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <Alert variant={backendStatus?.isHealthy ? "default" : "destructive"}>
                    <div className="flex items-start gap-3">
                      {backendStatus?.isHealthy ? (
                        <CheckCircle2 className="h-5 w-5 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription className="font-medium">
                          {backendStatus?.message}
                        </AlertDescription>
                        {backendStatus?.details && (
                          <AlertDescription className="text-xs mt-2 opacity-80">
                            Details: {JSON.stringify(backendStatus.details, null, 2)}
                          </AlertDescription>
                        )}
                      </div>
                    </div>
                  </Alert>

                  {!backendStatus?.isHealthy && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold mb-2">Next Steps:</div>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          <li>Click the "Diagnostics" tab above to run tests</li>
                          <li>Verify your Supabase configuration matches</li>
                          <li>Ensure database tables are created via SQL setup</li>
                          <li>Check that anon key is correct in your project</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={checkHealth} variant="outline" className="flex-1">
                      Recheck Status
                    </Button>
                    <Button onClick={() => setActiveTab('diagnostics')} className="flex-1">
                      Run Diagnostics
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <BackendDiagnostics />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
