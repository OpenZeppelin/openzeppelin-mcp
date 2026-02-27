import { getStatusCounters } from "../libraries/requestCounter";

export async function GET() {
  const usage = process.cpuUsage();
  const totalSeconds = (usage.user + usage.system) / 1e6;
  const memoria = process.memoryUsage();
  let body = `
# HELP up If the server is responding to HTTP requests
# TYPE up gauge
up 1
# HELP process_cpu_seconds_total Total CPU time in seconds
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total ${totalSeconds}
# HELP process_memoria_rss Resident Set Size: total memory allocated for the process
# TYPE process_memoria_rss gauge
process_memoria_rss ${memoria.rss}
# HELP process_memoria_heapTotal Total heap size allocated.
# TYPE process_memoria_heapTotal gauge
process_memoria_heapTotal ${memoria.heapTotal}
# HELP process_memoria_heapUsed Total heap size used.
# TYPE process_memoria_heapUsed gauge
process_memoria_heapUsed ${memoria.heapUsed}
# HELP process_memoria_external Total external memory size.
# TYPE process_memoria_external gauge
process_memoria_external ${memoria.external}
# HELP process_memoria_arrayBuffers Total array buffers size.
# TYPE process_memoria_arrayBuffers gauge
process_memoria_arrayBuffers ${memoria.arrayBuffers}
`;

  // Add status code metrics
  body += "# HELP http_requests_by_status Total requests per route and status code\n";
  body += "# TYPE http_requests_by_status counter\n";
  const statusCounters = getStatusCounters();
  // for loop inside for loop to iterate over all routes and status
  Object.entries(statusCounters).forEach(([route, statuses]) => {
    Object.entries(statuses).forEach(([status, count]) => {
      body += `http_requests_by_status{route="${route}",status="${status}"} ${count}\n`;
    });
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4",
    },
  });
}
