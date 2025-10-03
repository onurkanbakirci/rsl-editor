import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ValidatorHelp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About RSL Validation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold mb-2">What gets validated?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• XML structure and syntax</li>
              <li>• Required RSL elements and attributes</li>
              <li>• License configuration completeness</li>
              <li>• URL format validation</li>
              <li>• Email format validation</li>
              <li>• Payment information consistency</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Validation levels</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <span className="text-red-500">Errors:</span> Must be fixed for valid RSL</li>
              <li>• <span className="text-yellow-500">Warnings:</span> Recommendations for improvement</li>
              <li>• <span className="text-blue-500">Info:</span> Additional information</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
