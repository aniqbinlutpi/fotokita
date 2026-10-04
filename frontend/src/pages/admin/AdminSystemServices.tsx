import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminSystemServicesProps {
  systemPings: {
    weddingService: "checking" | "online" | "offline";
    mediaService: "checking" | "online" | "offline";
    adminService: "checking" | "online" | "offline";
  };
}

export function AdminSystemServices({ systemPings }: AdminSystemServicesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          System &amp; Microservices Status
        </h1>
        <p className="text-sm text-muted-foreground">
          Live operational health and telemetry across Fotokita backend microservices.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Wedding Service */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Wedding Service
              </CardTitle>
              <Badge
                variant={
                  systemPings.weddingService === "online"
                    ? "default"
                    : "destructive"
                }
                className="capitalize text-xs"
              >
                {systemPings.weddingService}
              </Badge>
            </div>
            <CardDescription>
              Port 3001 &bull; Metadata Management &amp; CRUD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span>Database:</span>
              <span className="font-mono text-foreground">PostgreSQL</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span>ORM:</span>
              <span className="font-mono text-foreground">Drizzle ORM</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Health Endpoint:</span>
              <span className="font-mono text-foreground">/health</span>
            </div>
          </CardContent>
        </Card>

        {/* Media Service */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Media Service
              </CardTitle>
              <Badge
                variant={
                  systemPings.mediaService === "online"
                    ? "default"
                    : "destructive"
                }
                className="capitalize text-xs"
              >
                {systemPings.mediaService}
              </Badge>
            </div>
            <CardDescription>
              Port 3000 &bull; Uploads &amp; S3 Presigned URLs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span>Object Storage:</span>
              <span className="font-mono text-foreground">Amazon S3</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span>URL Protocol:</span>
              <span className="font-mono text-foreground">Presigned S3</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Health Endpoint:</span>
              <span className="font-mono text-foreground">/health</span>
            </div>
          </CardContent>
        </Card>

        {/* Admin Service */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Admin Service
              </CardTitle>
              <Badge
                variant={
                  systemPings.adminService === "online"
                    ? "default"
                    : "outline"
                }
                className="capitalize text-xs"
              >
                {systemPings.adminService}
              </Badge>
            </div>
            <CardDescription>
              Port 3002 &bull; Auth &amp; Super Admin Aggregation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span>Security:</span>
              <span className="font-mono text-foreground">HMAC-SHA256 JWT</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span>Access Role:</span>
              <span className="font-mono text-foreground">Super Admin</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Health Endpoint:</span>
              <span className="font-mono text-foreground">/health</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Details */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Running Backend Microservices
          </CardTitle>
          <CardDescription>
            Commands to start all Fotokita services concurrently in your terminal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/60 font-mono text-xs space-y-2 overflow-x-auto">
            <p className="text-muted-foreground"># 1. Start PostgreSQL database container</p>
            <p className="text-foreground">docker compose up -d postgres</p>
            <p className="text-muted-foreground mt-3"># 2. Start Wedding Service (Port 3001)</p>
            <p className="text-foreground">cd services/wedding-service &amp;&amp; bun run dev</p>
            <p className="text-muted-foreground mt-3"># 3. Start Media Service (Port 3000)</p>
            <p className="text-foreground">cd services/media-service &amp;&amp; bun run dev</p>
            <p className="text-muted-foreground mt-3"># 4. Start Admin Service (Port 3002)</p>
            <p className="text-foreground">cd services/admin-service &amp;&amp; bun run dev</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
