import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Play, Globe, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const API_ENDPOINTS = [
  { method: "GET", path: "/hotels", description: "List all hotels" },
  { method: "GET", path: "/hotels/:id", description: "Get hotel by ID" },
  { method: "POST", path: "/hotels", description: "Create hotel" },
  { method: "PUT", path: "/hotels/:id", description: "Update hotel" },
  { method: "DELETE", path: "/hotels/:id", description: "Delete hotel" },
  { method: "GET", path: "/destinations", description: "List all destinations" },
  { method: "GET", path: "/destinations/:id", description: "Get destination by ID" },
  { method: "POST", path: "/destinations", description: "Create destination" },
  { method: "GET", path: "/attractions", description: "List all attractions" },
  { method: "POST", path: "/attractions", description: "Create attraction" },
  { method: "GET", path: "/bookings", description: "List all bookings (admin)" },
  { method: "GET", path: "/bookings/my", description: "My bookings" },
  { method: "POST", path: "/bookings", description: "Create booking" },
  { method: "GET", path: "/trips/all", description: "List all trips (admin)" },
  { method: "GET", path: "/trips/my", description: "My trips" },
  { method: "POST", path: "/trips", description: "Create trip" },
  { method: "GET", path: "/admin/users", description: "List users (admin)" },
  { method: "GET", path: "/admin/analytics/overview", description: "Analytics overview" },
  { method: "POST", path: "/auth/login", description: "User login" },
  { method: "POST", path: "/auth/register", description: "User registration" },
  { method: "GET", path: "/notifications", description: "Get notifications" },
  { method: "POST", path: "/payments/initialize", description: "Initialize payment" },
  { method: "POST", path: "/payments/verify", description: "Verify payment" },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  PATCH: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const ApiExplorer = () => {
  const { toast } = useToast();
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("/hotels");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setResponse("");
    setStatusCode(null);
    try {
      const config: any = { method: method.toLowerCase(), url };
      if (body && ["POST", "PUT", "PATCH"].includes(method)) {
        config.data = JSON.parse(body);
      }
      const res = await api(config);
      setStatusCode(res.status);
      setResponse(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      setStatusCode(err.response?.status || 500);
      setResponse(JSON.stringify(err.response?.data || { error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Explorer</h1>
        <p className="text-muted-foreground">Test and explore backend API endpoints</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" /> Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[600px] overflow-y-auto">
            {API_ENDPOINTS.map((ep, i) => (
              <button
                key={i}
                onClick={() => { setMethod(ep.method); setUrl(ep.path); }}
                className="w-full text-left p-2 rounded-md hover:bg-muted/50 flex items-center gap-2 text-sm transition-colors"
              >
                <Badge variant="outline" className={`${methodColors[ep.method]} text-[10px] font-mono px-1.5`}>
                  {ep.method}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground truncate">{ep.path}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Request / Response */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="h-4 w-4" /> Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/api/endpoint"
                  className="font-mono text-sm"
                />
                <Button onClick={handleSend} disabled={loading} className="bg-primary hover:bg-primary/90">
                  <Play className="h-4 w-4 mr-1" /> {loading ? "Sending..." : "Send"}
                </Button>
              </div>

              {["POST", "PUT", "PATCH"].includes(method) && (
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{ "key": "value" }'
                  className="font-mono text-sm min-h-[120px]"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Response</CardTitle>
              <div className="flex items-center gap-2">
                {statusCode && (
                  <Badge variant="outline" className={statusCode < 400 ? "text-emerald-600" : "text-red-600"}>
                    {statusCode}
                  </Badge>
                )}
                {response && (
                  <Button variant="ghost" size="sm" onClick={copyResponse}>
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted/50 rounded-lg p-4 text-xs font-mono overflow-auto max-h-[400px] whitespace-pre-wrap">
                {response || "Send a request to see the response here..."}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApiExplorer;
