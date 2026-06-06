export const MOCK_BOARDINGS: Record<string, any> = {
  "TK1903": {
    passengerName: "Selim Yılmaz",
    flightNumber: "TK-1903",
    from: "IST",
    fromCity: "İstanbul",
    to: "LHR",
    toCity: "Londra",
    gate: "G-12",
    seat: "12A",
    group: "A",
    biometricVerified: true,
    boardingStatus: "Boarding Now",
    boardingProgress: 68,
    estimatedWalkTime: "6 dk",
    airline: "Turkish Airlines",
    airportOperator: "İGA",
    departureTime: "22:15",
    securityQueueTime: 12
  },
  "PC2026": {
    passengerName: "Elif Demir",
    flightNumber: "PC-2026",
    from: "SAW",
    fromCity: "İstanbul Sabiha Gökçen",
    to: "ADB",
    toCity: "İzmir",
    gate: "204B",
    seat: "24B",
    group: "B",
    biometricVerified: true,
    boardingStatus: "Waiting",
    boardingProgress: 15,
    estimatedWalkTime: "3 dk",
    airline: "Pegasus Airlines",
    airportOperator: "HEAŞ",
    departureTime: "23:45",
    securityQueueTime: 25
  },
  "TK2108": {
    passengerName: "Dmitry Smirnov",
    flightNumber: "TK-2108",
    from: "ESB",
    fromCity: "Ankara Esenboğa",
    to: "MOW",
    toCity: "Moskova Vnukovo",
    gate: "B-08",
    seat: "05C",
    group: "VIP",
    biometricVerified: true,
    boardingStatus: "Delayed",
    boardingProgress: 5,
    estimatedWalkTime: "4 dk",
    airline: "Turkish Airlines",
    airportOperator: "TAV",
    departureTime: "01:30",
    securityQueueTime: 8
  },
  "AJ4112": {
    passengerName: "Can Aksoy",
    flightNumber: "AJ-4112",
    from: "ADB",
    fromCity: "İzmir Adnan Menderes",
    to: "IST",
    toCity: "İstanbul",
    gate: "102",
    seat: "14D",
    group: "C",
    biometricVerified: false,
    boardingStatus: "Closed",
    boardingProgress: 100,
    estimatedWalkTime: "8 dk",
    airline: "Ajet Airlines",
    airportOperator: "DHMİ",
    departureTime: "19:00",
    securityQueueTime: 35
  }
};

export let simVariables = {
  flightNumber: "TK-1903",
  boardingStatus: "Boarding Now", // "Boarding Now", "Waiting", "Closed", "Delayed", "Cancelled"
  securityQueueTime: 15, // in minutes
  gate: "G-12",
  delayReason: "Hava muhalefeti ve Londra hava sahası yoğunluğu nedeniyle biniş ertelenmiştir."
};

export function getSimVariables() {
  return simVariables;
}

export function updateSimVariables(newVals: any) {
  simVariables = { ...simVariables, ...newVals };
  return simVariables;
}
