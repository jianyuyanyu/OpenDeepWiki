
using Microsoft.AspNetCore.Mvc;

namespace OpenDeepWiki.Services
{
    [MiniApi(Route = "/api/v1")]
    [Tags("测试")]
    public class TestService
    {
        [HttpPost("/Test")]
        public async Task<int> Test()
        {
            return 1;
        }
    }
}
