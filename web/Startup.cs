using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LeanEngine.Base
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");

                routes.MapGet("__engine/{version}/ping", LeanEngineHealthCheck);
                routes.MapGet("{version}/functions/_ops/metadatas", LeanEngineMetadatas);
            });
        }

        public async Task LeanEngineHealthCheck(HttpRequest request, HttpResponse response, RouteData routeData)
        {
            IDictionary<string, object> json = new Dictionary<string, object>()
            {
                { "runtime", "donetcore-v2.0" },
                { "version", "1.0.0" }
            };
            await response.WriteAsync(json);
        }

        public async Task LeanEngineMetadatas(HttpRequest request, HttpResponse response, RouteData routeData)
        {
            var metaDatas = new object[] { };
            await response.WriteAsync(metaDatas.ToJsonString());
        }
    }
}
