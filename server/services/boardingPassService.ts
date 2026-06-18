import { adminDb, writeDocSecurely } from "./firestoreSync";
import { parseBoardingPassText, convertJulianDate } from "./bcbpParser";
import { TicketService } from "./ticketService";

export interface DigitalBoardingPass {
  passId: string;
  ticketId: string;
  flightNumber: string;
  barcodeRawData: string;
  biometricToken?: string;
  isBiometricFaceVerified: boolean;
  boardingSequence: number;
  issuedAt: string;
}

/**
 * BoardingPassService (Boarding Pass Repository Layer)
 * Manages decrypted IATA BCBP barcode payloads, turnstile token state updates,
 * Smart ID Face token bindings, and live airport security authorizations.
 */
export class BoardingPassService {
  private static instance: BoardingPassService;
  private memoryCache = new Map<string, DigitalBoardingPass>();

  private constructor() {
    this.bootstrapMockPasses();
  }

  public static getInstance(): BoardingPassService {
    if (!BoardingPassService.instance) {
      BoardingPassService.instance = new BoardingPassService();
    }
    return BoardingPassService.instance;
  }

  private bootstrapMockPasses() {
    const selimPass: DigitalBoardingPass = {
      passId: "pass_selim_1903",
      ticketId: "tkt_1903_selim_yilmaz",
      flightNumber: "TK-1903",
      barcodeRawData: "M1YILMAZ/SELIM       E1AAAAA ISTLHRTK 1903 120Y012A0001",
      biometricToken: "token_faceid_selim_9981827",
      isBiometricFaceVerified: true,
      boardingSequence: 1,
      issuedAt: new Date().toISOString()
    };

    const elifPass: DigitalBoardingPass = {
      passId: "pass_elif_2026",
      ticketId: "tkt_2026_elif_demir",
      flightNumber: "PC-2026",
      barcodeRawData: "M1DEMIR/ELIF         EELI202 SAWADBPC 2026 120Y024B0002",
      biometricToken: "token_faceid_elif_4718228",
      isBiometricFaceVerified: true,
      boardingSequence: 2,
      issuedAt: new Date().toISOString()
    };

    this.memoryCache.set(selimPass.passId, selimPass);
    this.memoryCache.set(elifPass.passId, elifPass);
  }

  /**
   * Retrieves an issued boarding pass record by its ticket ID.
   */
  public async getPassByTicketId(ticketId: string): Promise<DigitalBoardingPass | null> {
    for (const cached of this.memoryCache.values()) {
      if (cached.ticketId === ticketId) {
        return cached;
      }
    }

    if (adminDb) {
      try {
        const snap = await adminDb.collection("boarding_passes")
          .where("ticketId", "==", ticketId)
          .limit(1)
          .get();

        if (!snap.empty) {
          const pass = { passId: snap.docs[0].id, ...snap.docs[0].data() } as DigitalBoardingPass;
          this.memoryCache.set(pass.passId, pass);
          return pass;
        }
      } catch (err: any) {
        console.warn(`[BoardingPassService] Firestore query failed for ticketId ${ticketId}:`, err.message);
      }
    }

    return null;
  }

  /**
   * Generates or prints a new digital barcode ticket pass under authority regulations.
   */
  public async generatePassForTicket(ticketId: string, rawBarcode?: string): Promise<DigitalBoardingPass | null> {
    const ticket = await TicketService.getInstance().getTicketById(ticketId);
    if (!ticket) return null;

    const passId = `pass_${ticket.pnrCode.toLowerCase()}_${ticket.seatCode.toLowerCase()}`;
    const fallbackBarcode = `M1${ticket.passengerName.toUpperCase().replace(/\s/g, "")}/${ticket.flightNumber.toUpperCase()}      E${ticket.pnrCode} ${ticket.seatCode} ${ticket.ticketId}`;
    
    const newPass: DigitalBoardingPass = {
      passId,
      ticketId,
      flightNumber: ticket.flightNumber,
      barcodeRawData: rawBarcode || fallbackBarcode,
      isBiometricFaceVerified: false,
      boardingSequence: Math.floor(Math.random() * 100) + 1,
      issuedAt: new Date().toISOString()
    };

    this.memoryCache.set(passId, newPass);
    await writeDocSecurely("boarding_passes", passId, newPass);

    return newPass;
  }

  /**
   * Activates secure biometric face matching (Smart ID) for paperless turnstile gate clearance.
   */
  public async verifyBiometricFacePass(passId: string, faceVerifyResult: boolean): Promise<boolean> {
    for (const cached of this.memoryCache.values()) {
      if (cached.passId === passId) {
        cached.isBiometricFaceVerified = faceVerifyResult;
        if (faceVerifyResult) {
          cached.biometricToken = `token_live_face_${Math.floor(100000 + Math.random() * 900000)}`;
        }
        await writeDocSecurely("boarding_passes", passId, cached);
        return true;
      }
    }

    if (adminDb) {
      try {
        const docRef = adminDb.collection("boarding_passes").doc(passId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const pass = docSnap.data() as DigitalBoardingPass;
          pass.isBiometricFaceVerified = faceVerifyResult;
          if (faceVerifyResult) {
            pass.biometricToken = `token_live_face_${Math.floor(100000 + Math.random() * 900000)}`;
          }
          this.memoryCache.set(passId, pass);
          await docRef.set(pass, { merge: true });
          return true;
        }
      } catch (err: any) {
        console.warn(`[BoardingPassService] Firestore biometric update failed:`, err.message);
      }
    }

    return false;
  }

  /**
   * Decodes flight credentials from IATA Standard 792 string and synchronizes state updates.
   */
  public async decodeAndSyncIataBcbp(bcbpText: string): Promise<any> {
    const parseResult = parseBoardingPassText(bcbpText);
    
    if (parseResult.custom && parseResult.data) {
      const d = parseResult.data;
      
      // Attempt to register corresponding ticket and boarding pass records in backend on-the-fly
      try {
        const ticketSvc = TicketService.getInstance();
        const existingTicket = await ticketSvc.getTicketByPnrAndLastName(d.pnr, d.passengerName);
        
        let targetTicketId = existingTicket?.ticketId;
        if (!existingTicket) {
          const newT = await ticketSvc.createTicket({
            passengerId: "usr_on_the_fly_" + d.passengerName.toLowerCase().replace(/\s/g, "_"),
            passengerName: d.passengerName,
            flightNumber: d.flightNumber,
            pnrCode: d.pnr,
            cabinClass: d.cabinClass,
            seatCode: d.seat,
            luggageAllowance: {
              cabinBaggageWeightMaxKg: 8,
              checkedBaggageWeightMaxKg: 23,
              specialAccessTag: d.biometricVerified,
              specialWheelchairTag: d.group === "A"
            },
            mealPreference: "Standard / Havalimanı Seçimi",
            hasBaggageChecked: false,
            gateGroup: d.group === "A" ? "Group A (Öncelikli Biniş)" : "Group B (Ekonomi Sınıfı)"
          });
          targetTicketId = newT.ticketId;
        }

        if (targetTicketId) {
          const passSvc = BoardingPassService.getInstance();
          const existingPass = await passSvc.getPassByTicketId(targetTicketId);
          if (!existingPass) {
            await passSvc.generatePassForTicket(targetTicketId, bcbpText);
          }
        }
      } catch (err: any) {
        console.warn("[BoardingPassService] On-the-fly ticket sync ignored or failed:", err.message);
      }

      return d;
    }

    return null;
  }
}
