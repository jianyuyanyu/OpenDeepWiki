﻿FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER root
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["NuGet.Config", "."]
COPY ["Directory.Packages.props", "."]
COPY ["Directory.Build.props", "."]
COPY ["src/KoalaWiki/KoalaWiki.csproj", "src/KoalaWiki/"]
COPY ["framework/src/OpenDeepWiki.CodeFoundation/OpenDeepWiki.CodeFoundation.csproj", "framework/src/OpenDeepWiki.CodeFoundation/"]
COPY ["KoalaWiki.Domains/KoalaWiki.Domains.csproj", "KoalaWiki.Domains/"]
COPY ["Provider/KoalaWiki.Provider.PostgreSQL/KoalaWiki.Provider.PostgreSQL.csproj", "Provider/KoalaWiki.Provider.PostgreSQL/"]
COPY ["KoalaWiki.Core/KoalaWiki.Core.csproj", "KoalaWiki.Core/"]
COPY ["Provider/KoalaWiki.Provider.Sqlite/KoalaWiki.Provider.Sqlite.csproj", "Provider/KoalaWiki.Provider.Sqlite/"]
COPY ["Provider/KoalaWiki.Provider.SqlServer/KoalaWiki.Provider.SqlServer.csproj", "Provider/KoalaWiki.Provider.SqlServer/"]
COPY ["Provider/KoalaWiki.Provider.MySQL/KoalaWiki.Provider.MySQL.csproj", "Provider/KoalaWiki.Provider.MySQL/"]
COPY ["src/KoalaWiki.ServiceDefaults/KoalaWiki.ServiceDefaults.csproj", "src/KoalaWiki.ServiceDefaults/"]
RUN dotnet restore "src/KoalaWiki/KoalaWiki.csproj"
COPY . .
WORKDIR "/src/src/KoalaWiki"
RUN dotnet build "./KoalaWiki.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./KoalaWiki.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "KoalaWiki.dll"]
