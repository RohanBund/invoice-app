FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["InvoiceApp.API/InvoiceApp.API.csproj", "InvoiceApp.API/"]
COPY ["InvoiceApp.Application/InvoiceApp.Application.csproj", "InvoiceApp.Application/"]
COPY ["InvoiceApp.Domain/InvoiceApp.Domain.csproj", "InvoiceApp.Domain/"]
COPY ["InvoiceApp.Infrastructure/InvoiceApp.Infrastructure.csproj", "InvoiceApp.Infrastructure/"]
RUN dotnet restore "InvoiceApp.API/InvoiceApp.API.csproj"
COPY . .
WORKDIR "/src/InvoiceApp.API"
RUN dotnet publish "InvoiceApp.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "InvoiceApp.API.dll"]