using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;

namespace LeanEngine.Base
{
    public static class Extensions
    {
        public static Task WriteAsync(this HttpResponse response, IDictionary<string, object> json)
        {
            var jsonString = json.ToJsonString();
            return response.WriteAsync(jsonString);
        }

        public static string ToJsonString<T>(this IEnumerable<T> source)
        {
            string json = JsonConvert.SerializeObject(source, new JsonSerializerSettings()
            {

            });
            return json;
        }

        public static string ToJsonString(this IDictionary<string, object> source)
        {
            string json = JsonConvert.SerializeObject(source, new JsonSerializerSettings()
            {

            });
            return json;
        }

        public static IDictionary<string, object> ToDictionary(this string obj)
        {
            var values = JsonConvert.DeserializeObject<Dictionary<string, object>>(obj);
            return values;
        }
    }
}
