// Helper to convert Julian Date to Gregorian Month Day format for 2026
export function convertJulianDate(julianStr: string): string {
  const dayNum = parseInt(julianStr, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 366) {
    return "Bilinmiyor";
  }
  
  // Non-leap year 2026 months cumulative days
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  
  let currentDays = 0;
  for (let i = 0; i < 12; i++) {
    if (dayNum <= currentDays + daysInMonths[i]) {
      const dayOfMonth = dayNum - currentDays;
      return `${dayOfMonth} ${monthNames[i]}`;
    }
    currentDays += daysInMonths[i];
  }
  return "Bilinmiyor";
}

// Helper to resolve Cabin Class and Boarding Group based on IATA compartment code
export function getCabinInfo(cabinChar: string): { name: string, group: string } {
  const char = (cabinChar || "Y").toUpperCase();
  if (["F", "A", "P"].includes(char)) {
    return { name: "First Class (Birinci Sınıf)", group: "Group A (Öncelikli Biniş)" };
  }
  if (["C", "J", "D", "I", "Z"].includes(char)) {
    return { name: "Business Class (İş Sınıfı)", group: "Group A (Öncelikli Biniş)" };
  }
  if (["W", "E"].includes(char)) {
    return { name: "Premium Economy (Premium Ekonomi)", group: "Group B (Ekonomi Sınıfı)" };
  }
  return { name: "Economy Class (Ekonomi Sınıfı)", group: "Group B (Ekonomi Sınıfı)" };
}

// Helper to remove any leading zeros from the numeric part of the seat code
export function formatSeatNumber(rawSeat: string): string {
  const cleaned = (rawSeat || "").trim().toUpperCase();
  if (!cleaned) return "15E"; 
  const match = cleaned.match(/^0*(\d+[A-Z])$/);
  if (match) {
    return match[1];
  }
  return cleaned;
}

// Helper function to extract and parse IATA BCBP or map pre-defined flight patterns
export function parseBoardingPassText(rawText: string): { flightId?: string, custom: boolean, data?: any } {
  if (!rawText) {
    return { custom: false, flightId: "TK1903" };
  }
  
  const uppercaseRaw = rawText.toUpperCase();
  const hasIataPrefix = uppercaseRaw.startsWith("M") || uppercaseRaw.startsWith("S");
  if (!hasIataPrefix) {
    if (uppercaseRaw.includes("TK1903") || uppercaseRaw.includes("TK-1903") || uppercaseRaw.includes("SELIM")) {
      return { flightId: "TK1903", custom: false };
    } else if (uppercaseRaw.includes("PC2026") || uppercaseRaw.includes("PC-2026") || uppercaseRaw.includes("ELIF")) {
      return { flightId: "PC2026", custom: false };
    } else if (uppercaseRaw.includes("TK2108") || uppercaseRaw.includes("TK-2108") || uppercaseRaw.includes("DMITRY")) {
      return { flightId: "TK2108", custom: false };
    } else if (uppercaseRaw.includes("AJ4112") || uppercaseRaw.includes("AJ-4112") || uppercaseRaw.includes("CAN")) {
      return { flightId: "AJ4112", custom: false };
    }
  }

  // Attempt IATA BCBP Standard 792 parsing
  if (hasIataPrefix) {
    let passengerName = "";
    let pnr = "";
    let from = "IST";
    let to = "LHR";
    let carrier = "TK";
    let flightNum = "1903";
    let julianDate = "120";
    let cabinClass = "Y";
    let seat = "15E";
    let sequenceNumber = "0001";

    // Strict fixed-width column parse criteria (Standard IATA 792 has size >= 58 with E-ticket sign)
    if (rawText.length >= 58 && !rawText.includes("  ") && rawText[22] === "E") {
      passengerName = rawText.substring(2, 22).replace("/", " ").trim();
      pnr = rawText.substring(23, 30).trim();
      from = rawText.substring(30, 33).trim();
      to = rawText.substring(33, 36).trim();
      carrier = rawText.substring(36, 39).trim();
      flightNum = rawText.substring(39, 44).trim();
      julianDate = rawText.substring(44, 47).trim();
      cabinClass = rawText[47] || "Y";
      seat = rawText.substring(48, 52).trim();
      sequenceNumber = rawText.substring(52, 57).trim();
    } else {
      // Loose & context-aware regex-token matching for non-padded or semi-padded strings
      const nameMatch = rawText.match(/M[1-4]([A-Z\s\/]{2,20}?)(\s+E|E\s+|\s+E\s+|\bE\b)/i) || rawText.match(/M[1-4]([A-Z\/\s]+?)(?=\s[A-Z0-9]{7}\s|$)/i);
      if (nameMatch) {
         passengerName = nameMatch[1].replace("/", " ").trim();
      } else {
         const simpleName = rawText.match(/M[1-4]([A-Z\/]+)/i);
         passengerName = simpleName ? simpleName[1].replace("/", " ").trim() : "YOLCU";
      }

      const pnrMatch = rawText.match(/(?:E\s+([A-Z0-9]{6,7})|\b([A-Z0-9]{7})\b)/i);
      if (pnrMatch) {
         pnr = (pnrMatch[1] || pnrMatch[2]).trim();
      } else {
         pnr = "ABC1234";
      }

      const routeMatch = rawText.match(/([A-Z]{3})([A-Z]{3})([A-Z]{2})\s*([0-9]{3,5})/i);
      if (routeMatch) {
         from = routeMatch[1];
         to = routeMatch[2];
         carrier = routeMatch[3];
         flightNum = routeMatch[4];
      }

      // Check details sequence like 120Y012A0001
      const detailsMatch = rawText.match(/([0-9]{3})([A-Z])([0-9]{3}[A-Z]|[0-9]{2}[A-Z])([0-9]{4,5})/i);
      if (detailsMatch) {
         julianDate = detailsMatch[1];
         cabinClass = detailsMatch[2];
         seat = detailsMatch[3];
         sequenceNumber = detailsMatch[4];
      } else {
         // Separate fallback matcher
         const julianMatch = rawText.match(/\s([0-9]{3})(Y|C|F|W)\b/i);
         if (julianMatch) {
            julianDate = julianMatch[1];
            cabinClass = julianMatch[2];
         }
         const seatSeqMatch = rawText.match(/(Y|C|F|W)([0-9]{2,3}[A-Z])([0-9]{3,5})/i);
         if (seatSeqMatch) {
            cabinClass = seatSeqMatch[1];
            seat = seatSeqMatch[2];
            sequenceNumber = seatSeqMatch[3];
         }
      }
    }

    // Sanitize values
    passengerName = passengerName.replace(/\s+/g, " ").trim();
    if (passengerName.endsWith(" E")) {
       passengerName = passengerName.substring(0, passengerName.length - 2).trim();
    }

    const cleanedSeat = formatSeatNumber(seat);
    const flightFormatted = `${carrier.toUpperCase()}-${parseInt(flightNum, 10)}`;
    const resolvedOperator = from.toUpperCase() === "IST" ? "İGA" : from.toUpperCase() === "SAW" ? "HEAŞ" : "DHMİ";
    const cabinInfo = getCabinInfo(cabinClass);
    const julianDateFormatted = convertJulianDate(julianDate);

    let resolvedAirline = "Özel Taşıyıcı";
    if (carrier.toUpperCase() === "TK") resolvedAirline = "Turkish Airlines";
    else if (carrier.toUpperCase() === "PC") resolvedAirline = "Pegasus Airlines";
    else if (carrier.toUpperCase() === "AJ") resolvedAirline = "Ajet Airlines";

    const getCityName = (code: string) => {
      const c = code.toUpperCase();
      if (c === "IST") return "İstanbul";
      if (c === "SAW") return "Sabiha Gökçen";
      if (c === "LHR") return "Londra";
      if (c === "ADB") return "İzmir";
      if (c === "CDG") return "Paris";
      if (c === "MOW") return "Moskova";
      if (c === "JFK") return "New York";
      return "Yerel Havalimanı";
    };

    const parsedData = {
      passengerName,
      pnr: pnr.toUpperCase(),
      flightNumber: flightFormatted,
      from: from.toUpperCase(),
      fromCity: getCityName(from),
      to: to.toUpperCase(),
      toCity: getCityName(to),
      gate: "A-01",
      seat: cleanedSeat,
      sequenceNumber: parseInt(sequenceNumber, 10).toString(),
      cabinClass: cabinInfo.name,
      group: cabinInfo.group === "Group A (Öncelikli Biniş)" ? "A" : "B",
      julianDateRaw: julianDate,
      julianDateFormatted,
      biometricVerified: true,
      boardingStatus: "Waiting",
      boardingProgress: 30,
      estimatedWalkTime: "5 dk",
      airline: resolvedAirline,
      airportOperator: resolvedOperator,
      departureTime: "22:45",
      securityQueueTime: 15,
      isIataStandard: true
    };

    return { custom: true, data: parsedData };
  }

  return null;
}
