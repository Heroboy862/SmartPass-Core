export interface TransportRoute {
  name: string;
  price: number;
  stops: string[];
  times: string[];
  frequency: string;
  platform: string;
}

export const SERVER_TRANSPORT_DATA: Record<string, Record<string, TransportRoute>> = {
  "istanbul-ist": {
    "hvist-14": {
      name: "HVİST-14 (Taksim - Beşiktaş)",
      price: 250,
      stops: ["İstanbul Havalimanı (IST)", "Göktürk Metro", "Nurtepe Viyadük", "Zincirlikuyu", "Beşiktaş", "Taksim Meydanı"],
      times: ["06:00", "07:00", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "02:00", "04:00"],
      frequency: "30 dakikada bir",
      platform: "Peron 14 - Gelen Katı"
    },
    "hvist-9": {
      name: "HVİST-9 (Kadıköy - Yenisahra)",
      price: 270,
      stops: ["İstanbul Havalimanı (IST)", "Kavacık Köprüsü", "Göztepe", "Yenisahra", "Kadıköy Metro"],
      times: ["06:15", "07:15", "08:15", "08:45", "09:15", "09:45", "10:15", "10:45", "11:15", "11:45", "12:15", "12:45", "13:15", "13:45", "14:15", "14:45", "15:15", "15:45", "16:15", "16:45", "17:15", "17:45", "18:15", "18:45", "19:15", "19:45", "20:15", "20:45", "21:15", "21:45", "22:15", "23:15", "00:15", "02:15", "04:15"],
      frequency: "30 dakikada bir",
      platform: "Peron 9 - Gelen Katı"
    },
    "hvist-12": {
      name: "HVİST-12 (Aksaray - Beyazıt)",
      price: 250,
      stops: ["İstanbul Havalimanı (IST)", "Ayvansaray", "Ulubatlı", "Aksaray Metro", "Beyazıt Meydanı"],
      times: ["06:20", "07:20", "08:20", "08:50", "09:20", "09:50", "10:20", "10:50", "11:20", "11:50", "12:20", "12:50", "13:20", "13:50", "14:20", "14:50", "15:20", "15:50", "16:20", "16:50", "17:20", "17:50", "18:20", "18:50", "19:20", "19:50", "20:20", "20:50", "21:20", "21:50", "22:20", "23:20", "00:20"],
      frequency: "30 dakikada bir",
      platform: "Peron 12 - Gelen Katı"
    }
  },
  "istanbul-saw": {
    "m4-metro": {
      name: "M4 Metro (Kadıköy - Sabiha Gökçen)",
      price: 40,
      stops: ["Sabiha Gökçen Havalimanı (SAW)", "Pendik Metro", "Kartal", "Bostancı", "Yenisahra", "Kadıköy Merkez"],
      times: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00"],
      frequency: "8-10 dakikada bir",
      platform: "Havalimanı Metro İstasyon Girişi"
    },
    "iett-e11": {
      name: "İETT E-11 (Kadıköy - Ekspres Yolcu)",
      price: 60,
      stops: ["Sabiha Gökçen Havalimanı (SAW)", "Yeniahra", "Göztepe Köprüsü", "Acıbadem", "Kadıköy İskele"],
      times: ["06:10", "06:50", "07:30", "08:10", "08:50", "09:30", "10:10", "10:50", "11:30", "12:10", "12:50", "13:30", "14:10", "14:50", "15:30", "16:10", "16:50", "17:30", "18:10", "18:50", "19:30", "20:10", "20:50", "21:35", "22:20", "23:10", "00:05"],
      frequency: "40 dakikada bir",
      platform: "Sabiha Gökçen Belediye Otobüs Alanı"
    },
    "havas-saw-taksim": {
      name: "SG Havaş (Taksim - Gece ve Gündüz)",
      price: 260,
      stops: ["Sabiha Gökçen Havalimanı (SAW)", "Kavacık Köprüsü", "Zincirlikuyu Metrobüs", "Taksim Tepebaşı"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:30", "01:30", "03:30", "05:00"],
      frequency: "60 dakikada bir",
      platform: "Gelen Yolcu Çıkışı Peron Alanı"
    }
  },
  "izmir": {
    "havas-mavi": {
      name: "Havaş Mavişehir (Alsancak - Karşıyaka)",
      price: 220,
      stops: ["Adnan Menderes Havalimanı (ADB)", "Gaziemir", "Karabağlar", "Halkapınar Metro", "Bayraklı", "Karşıyaka Çarşı", "Bostanlı İskele", "Mavişehir"],
      times: ["06:00", "07:00", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "01:00", "02:00", "03:30", "05:00"],
      frequency: "30 dakikada bir",
      platform: "TAV ADB Dış Hatlar Çıkışı"
    },
    "havas-bornova": {
      name: "Havaş Bornova (Ege Üniversitesi)",
      price: 220,
      stops: ["Adnan Menderes Havalimanı (ADB)", "Bornova Metro", "Ege Üniversitesi Hastanesi"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:30", "01:30", "03:00", "05:00"],
      frequency: "60 dakikada bir",
      platform: "TAV ADB İç Hatlar Çıkışı"
    },
    "havas-cesme": {
      name: "Havaş Çeşme (Otogar - Alaçatı)",
      price: 400,
      stops: ["Adnan Menderes Havalimanı (ADB)", "Alaçatı Terminali", "Çeşme Otogarı"],
      times: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:00"],
      frequency: "120 dakikada bir",
      platform: "TAV İzmir Çeşme Peronu"
    }
  },
  "ankara": {
    "belko-442": {
      name: "Belko Air 442 (Esenboğa - Kızılay - AŞTİ)",
      price: 120,
      stops: ["Esenboğa Havalimanı (ESB)", "Pursaklar", "Hasköy", "AKM Metro", "Kızılay", "AŞTİ Terminali"],
      times: ["06:00", "06:20", "06:40", "07:00", "07:20", "07:40", "08:00", "08:20", "08:40", "09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00", "11:20", "11:40", "12:00", "12:20", "12:40", "13:00", "13:20", "13:40", "14:00", "14:20", "14:40", "15:00", "15:20", "15:40", "16:00", "16:20", "16:40", "17:00", "17:20", "17:40", "18:00", "18:20", "18:40", "19:00", "19:20", "19:40", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "01:00", "02:00", "03:00", "04:30"],
      frequency: "20 dakikada bir",
      platform: "Esenboğa Gelen Yolcu Peron 2"
    },
    "havas-ankara": {
      name: "Havaş Ankara (Esenboğa - YHT Gar)",
      price: 150,
      stops: ["Esenboğa Havalimanı (ESB)", "Pursaklar", "Ankara Yüksek Hızlı Tren Garı"],
      times: ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30", "23:30", "00:00", "01:00", "02:30"],
      frequency: "60 dakikada bir",
      platform: "Esenboğa Gelen Yolcu Havaş Alanı"
    }
  },
  "antalya": {
    "antray-tram": {
      name: "Antray T1A Tramvay (Havalimanı - Otogar)",
      price: 40,
      stops: ["Antalya Havalimanı (AYT)", "Meydan Merkez", "Doğu Garajı", "MarkAntalya", "Fatih İstasyonu (Otogar)"],
      times: ["06:05", "06:20", "06:35", "06:50", "07:05", "07:20", "07:35", "07:50", "08:05", "08:20", "08:35", "08:50", "09:05", "09:20", "09:35", "09:50", "10:05", "10:20", "10:35", "10:50", "11:05", "11:20", "11:35", "11:50", "12:05", "12:20", "12:35", "12:50", "13:05", "13:20", "13:35", "13:50", "14:05", "14:20", "14:35", "14:50", "15:05", "15:20", "15:35", "15:50", "16:05", "16:20", "16:35", "16:50", "17:05", "17:20", "17:35", "17:50", "18:05", "18:20", "18:35", "18:50", "19:05", "19:20", "19:35", "19:50", "20:05", "20:20", "20:35", "20:50", "21:05", "21:20", "21:35", "21:50", "22:05", "22:20", "22:40", "23:00", "23:25", "23:50"],
      frequency: "15 dakikada bir",
      platform: "AYT Terminal 1 Tramvay İstasyonu"
    },
    "havas-antalya": {
      name: "Havaş Antalya (5M Migros - Konyaaltı)",
      price: 160,
      stops: ["Antalya Havalimanı (AYT)", "Gazi Bulvarı", "Çallı Kavşağı", "Otogar Terminali", "5M Migros Konyaaltı"],
      times: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00", "02:30", "04:00"],
      frequency: "60 dakikada bir",
      platform: "AYT İç ve Dış Hatlar Gelen Yolcu Çıkışı"
    }
  },
  "mugla": {
    "muttas-bodrum": {
      name: "MUTTAŞ 48-24 Bodrum Merkez Otogar",
      price: 180,
      stops: ["Milas-Bodrum Havalimanı (BJV)", "Güvercinlik", "Yokuşbaşı Torba", "Bodrum Otogarı Mekez"],
      times: ["07:30", "08:30", "09:45", "11:00", "12:15", "13:30", "14:45", "16:00", "17:15", "18:30", "19:45", "21:00", "22:15", "23:30", "01:00", "02:30"],
      frequency: "Geliş/Gidiş Sefer Uyumlu",
      platform: "BJV İç Hatlar Çıkış Peronu"
    },
    "havas-dalam-fethiye": {
      name: "Havaş Dalaman (Göcek - Fethiye)",
      price: 210,
      stops: ["Dalaman Havalimanı (DLM)", "Ortaca", "Göcek Tüneli", "Günlükbaşı", "Fethiye Otogarı"],
      times: ["08:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30", "22:00", "23:30", "01:00", "03:00"],
      frequency: "Uçak İnişlerini Takiben",
      platform: "Dalaman Havalimanı Gelen Yolcu Önü"
    }
  }
};
