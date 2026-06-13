/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeatherDetail {
  code: string;
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  icon: "sunny" | "cloudy" | "rainy" | "windy" | "stormy" | "foggy";
  humidity: number;
  windSpeed: number;
  visibility: string;
  aviationStatus: "Normal" | "Caution - crosswinds" | "Caution - low visibility" | "Caution - rainy runway";
  aviationStatusDetail: string;
}

export interface FlightWeatherResponse {
  from: WeatherDetail;
  to: WeatherDetail;
  updatedAt: string;
}

// Fixed base values for popular cities to ensure realistic and relatable default data
const WEATHER_DICTIONARY: Record<string, { city: string; baseTemp: number; icon: "sunny" | "cloudy" | "rainy" | "windy" | "stormy" | "foggy"; condition: string }> = {
  IST: { city: "İstanbul", baseTemp: 23, icon: "sunny", condition: "Açık ve Güneşli" },
  SAW: { city: "İstanbul", baseTemp: 22, icon: "cloudy", condition: "Parçalı Bulutlu" },
  ADB: { city: "İzmir", baseTemp: 28, icon: "sunny", condition: "Sıcak ve Nalemli" },
  ESB: { city: "Ankara", baseTemp: 20, icon: "sunny", condition: "Açık ve Esintili" },
  AYT: { city: "Antalya", baseTemp: 31, icon: "sunny", condition: "Çok Sıcak, Açık" },
  BJV: { city: "Bodrum", baseTemp: 29, icon: "sunny", condition: "Açık ve Esintili" },
  DLM: { city: "Dalaman", baseTemp: 29, icon: "sunny", condition: "Açık ve Sıcak" },
  LHR: { city: "Londra", baseTemp: 16, icon: "rainy", condition: "Hafif Yağmurlu" },
  CDG: { city: "Paris", baseTemp: 18, icon: "cloudy", condition: "Bulutlu" },
  JFK: { city: "New York", baseTemp: 21, icon: "cloudy", condition: "Parçalı Bulutlu" },
  DXB: { city: "Dubai", baseTemp: 38, icon: "sunny", condition: "Aşırı Sıcak, Açık" },
  AMS: { city: "Amsterdam", baseTemp: 15, icon: "rainy", condition: "Çiseleyen Yağmurlu" },
  FRA: { city: "Frankfurt", baseTemp: 17, icon: "cloudy", condition: "Puslu ve Parçalı Bulutlu" },
  FCO: { city: "Roma", baseTemp: 25, icon: "sunny", condition: "Açık, Güneşli" },
};

/**
 * Returns dynamic weather information generated with airport details.
 */
export function getWeatherForAirports(fromCode: string, fromCity: string, toCode: string, toCity: string): FlightWeatherResponse {
  const normalizedFrom = (fromCode || "IST").toUpperCase();
  const normalizedTo = (toCode || "LHR").toUpperCase();

  // Helper to generate details
  const getAirportWeather = (code: string, cityFallback: string): WeatherDetail => {
    const matched = WEATHER_DICTIONARY[code];
    const baseTemp = matched ? matched.baseTemp : 20;
    const icon = matched ? matched.icon : "cloudy";
    const condition = matched ? matched.condition : "Parçalı Bulutlu";
    const city = matched ? matched.city : cityFallback;

    // Introduce dynamic slight fluctuations based on current time
    const currentHour = new Date().getHours();
    const fluctuation = Math.sin((currentHour / 24) * Math.PI * 2) * 3; // fluctuating -3 to +3
    const finalTemp = Math.round(baseTemp + fluctuation);
    const feelsLike = Math.round(finalTemp + (icon === "sunny" ? 1 : icon === "windy" ? -2 : 0));

    // Dynamic wind, humidity, and visibility based on icon type
    let windSpeed = 12;
    let humidity = 60;
    let visibility = "10 km";
    let aviationStatus: WeatherDetail["aviationStatus"] = "Normal";
    let aviationStatusDetail = "Görüş ve meydan limitleri operasyonlara tamamen elverişli.";

    if (icon === "sunny") {
      windSpeed = Math.round(5 + Math.random() * 8);
      humidity = Math.round(30 + Math.random() * 20);
      visibility = "10+ km";
    } else if (icon === "rainy") {
      windSpeed = Math.round(15 + Math.random() * 10);
      humidity = Math.round(80 + Math.random() * 15);
      visibility = "7 km";
      aviationStatus = "Caution - rainy runway";
      aviationStatusDetail = "Islak pist yüzeyi. Frenleme katsayısı izleniyor.";
    } else if (icon === "windy") {
      windSpeed = Math.round(25 + Math.random() * 15);
      humidity = Math.round(40 + Math.random() * 20);
      visibility = "10 km";
      aviationStatus = "Caution - crosswinds";
      aviationStatusDetail = "Kuvvetli rüzgarlar mevcut. Açılı yaklaşmaya dikkat.";
    } else if (icon === "stormy") {
      windSpeed = Math.round(35 + Math.random() * 20);
      humidity = Math.round(85 + Math.random() * 15);
      visibility = "4 km";
      aviationStatus = "Caution - low visibility";
      aviationStatusDetail = "Fırtına bulutları ve rüzgâr hamlesi. Görüş kısıtlı.";
    } else if (icon === "foggy") {
      windSpeed = Math.round(2 + Math.random() * 5);
      humidity = Math.round(90 + Math.random() * 10);
      visibility = "800 m";
      aviationStatus = "Caution - low visibility";
      aviationStatusDetail = "Yoğun sis tabakası. ILS CAT II/III yaklaşması aktif.";
    } else {
      // Cloudy
      windSpeed = Math.round(10 + Math.random() * 10);
      humidity = Math.round(55 + Math.random() * 20);
      visibility = "10 km";
    }

    return {
      code,
      city,
      temp: finalTemp,
      feelsLike,
      condition,
      icon,
      humidity,
      windSpeed,
      visibility,
      aviationStatus,
      aviationStatusDetail,
    };
  };

  return {
    from: getAirportWeather(normalizedFrom, fromCity || "İstanbul"),
    to: getAirportWeather(normalizedTo, toCity || "Londra"),
    updatedAt: new Date().toISOString(),
  };
}
