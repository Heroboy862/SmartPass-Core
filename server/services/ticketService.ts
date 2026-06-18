import { adminDb, writeDocSecurely } from "./firestoreSync";

export interface LuggageAllowance {
  cabinBaggageWeightMaxKg: number;
  checkedBaggageWeightMaxKg: number;
  specialAccessTag: boolean; // Priority security screening / Fast Track
  specialWheelchairTag: boolean; // Tag for wheelchair baggage delivery
}

export interface Ticket {
  ticketId: string;
  passengerId: string;
  passengerName: string;
  flightNumber: string;
  pnrCode: string;
  cabinClass: string;
  seatCode: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  luggageAllowance: LuggageAllowance;
  mealPreference: string;
  hasBaggageChecked: boolean;
  checkedBaggageWeightKg?: number;
  gateGroup: string;
  issuedAt: string;
}

/**
 * TicketService (Ticket & Reservation Repository Layer)
 * Manages ticket reservations mapping, seat allocations, dynamic luggage weight updates,
 * meal preferences, and accessibility tags mapped to digital gate passes.
 */
export class TicketService {
  private static instance: TicketService;
  private memoryCache = new Map<string, Ticket>();

  private constructor() {
    this.bootstrapMockTickets();
  }

  public static getInstance(): TicketService {
    if (!TicketService.instance) {
      TicketService.instance = new TicketService();
    }
    return TicketService.instance;
  }

  private bootstrapMockTickets() {
    const selimTicket: Ticket = {
      ticketId: "tkt_1903_selim_yilmaz",
      passengerId: "usr_selim_yilmaz_smartpass_co",
      passengerName: "Selim Yılmaz",
      flightNumber: "TK-1903",
      pnrCode: "1AAAAA",
      cabinClass: "Economy Class (Ekonomi Sınıfı)",
      seatCode: "12A",
      status: "CONFIRMED",
      luggageAllowance: {
        cabinBaggageWeightMaxKg: 8,
        checkedBaggageWeightMaxKg: 23,
        specialAccessTag: true,
        specialWheelchairTag: true
      },
      mealPreference: "Halal / Standart (Müslüman Menüsü)",
      hasBaggageChecked: true,
      checkedBaggageWeightKg: 19.4,
      gateGroup: "Group A (Öncelikli Biniş)",
      issuedAt: new Date().toISOString()
    };

    const elifTicket: Ticket = {
      ticketId: "tkt_2026_elif_demir",
      passengerId: "usr_elif_demir_smartpass_co",
      passengerName: "Elif Demir",
      flightNumber: "PC-2026",
      pnrCode: "ELI202",
      cabinClass: "Economy Class (Ekonomi Sınıfı)",
      seatCode: "24B",
      status: "CONFIRMED",
      luggageAllowance: {
        cabinBaggageWeightMaxKg: 8,
        checkedBaggageWeightMaxKg: 15,
        specialAccessTag: true,
        specialWheelchairTag: false
      },
      mealPreference: "Gluten-Free (Glutensiz Menü)",
      hasBaggageChecked: false,
      gateGroup: "Group B (Ekonomi Sınıfı)",
      issuedAt: new Date().toISOString()
    };

    this.memoryCache.set(selimTicket.ticketId, selimTicket);
    this.memoryCache.set(elifTicket.ticketId, elifTicket);
  }

  /**
   * Retrieves a ticket record by its unique identifier.
   */
  public async getTicketById(ticketId: string): Promise<Ticket | null> {
    const cached = this.memoryCache.get(ticketId);

    if (adminDb) {
      try {
        const docRef = adminDb.collection("tickets").doc(ticketId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const ticketData = docSnap.data() as Ticket;
          this.memoryCache.set(ticketId, ticketData);
          return ticketData;
        }
      } catch (err: any) {
        console.warn(`[TicketService] Firestore read failed for ticket ${ticketId}:`, err.message);
      }
    }

    return cached || null;
  }

  /**
   * Performs dynamic ticket extraction based on PNR secure lookups.
   */
  public async getTicketByPnrAndLastName(pnr: string, lastName: string): Promise<Ticket | null> {
    const cleanPnr = pnr.toUpperCase().trim();
    const cleanLastName = lastName.toLowerCase().trim();

    // Scan memory cache first
    for (const cached of this.memoryCache.values()) {
      const matchName = cached.passengerName.toLowerCase().split(" ").pop() === cleanLastName;
      if (cached.pnrCode === cleanPnr && matchName) {
        return cached;
      }
    }

    if (adminDb) {
      try {
        const snap = await adminDb.collection("tickets")
          .where("pnrCode", "==", cleanPnr)
          .limit(10)
          .get();

        if (!snap.empty) {
          for (const doc of snap.docs) {
            const ticket = doc.data() as Ticket;
            const tLastName = ticket.passengerName.toLowerCase().split(" ").pop();
            if (tLastName === cleanLastName) {
              this.memoryCache.set(ticket.ticketId, ticket);
              return ticket;
            }
          }
        }
      } catch (err: any) {
        console.warn(`[TicketService] Firestore PNR query failed:`, err.message);
      }
    }

    return null;
  }

  /**
   * Returns all booked/confirmed tickets for a given passenger.
   */
  public async getTicketsByPassengerId(passengerId: string): Promise<Ticket[]> {
    const tickets: Ticket[] = [];

    for (const cached of this.memoryCache.values()) {
      if (cached.passengerId === passengerId) {
        tickets.push(cached);
      }
    }

    if (adminDb) {
      try {
        const snap = await adminDb.collection("tickets")
          .where("passengerId", "==", passengerId)
          .get();

        const list: Ticket[] = [];
        snap.forEach((doc: any) => {
          list.push(doc.data() as Ticket);
        });

        if (list.length > 0) {
          list.forEach(t => this.memoryCache.set(t.ticketId, t));
          return list;
        }
      } catch (err) {
        // use memory
      }
    }

    return tickets;
  }

  /**
   * Sells or issues a new ticket reservation in the system.
   */
  public async createTicket(ticket: Omit<Ticket, "ticketId" | "status" | "issuedAt">): Promise<Ticket> {
    const ticketId = `tkt_${ticket.pnrCode.toLowerCase()}_${ticket.passengerName.toLowerCase().replace(/\s/g, "_")}`;
    const newTicket: Ticket = {
      ...ticket,
      ticketId,
      status: "CONFIRMED",
      issuedAt: new Date().toISOString()
    };

    this.memoryCache.set(ticketId, newTicket);
    await writeDocSecurely("tickets", ticketId, newTicket);

    return newTicket;
  }

  /**
   * Allows check-in luggage weight limits update for digital tracking.
   */
  public async updateBaggageCheckIn(ticketId: string, hasBaggageChecked: boolean, weightKg: number): Promise<boolean> {
    const tkt = await this.getTicketById(ticketId);
    if (!tkt) return false;

    tkt.hasBaggageChecked = hasBaggageChecked;
    tkt.checkedBaggageWeightKg = weightKg;

    this.memoryCache.set(ticketId, tkt);
    return await writeDocSecurely("tickets", ticketId, tkt);
  }

  /**
   * Sets accessibility flight and tag assistance fields dynamically on the seat voucher.
   */
  public async updateSpecialAssistance(
    ticketId: string,
    wheelchairTag: boolean,
    specialAccessTag: boolean
  ): Promise<boolean> {
    const tkt = await this.getTicketById(ticketId);
    if (!tkt) return false;

    tkt.luggageAllowance.specialWheelchairTag = wheelchairTag;
    tkt.luggageAllowance.specialAccessTag = specialAccessTag;

    this.memoryCache.set(ticketId, tkt);
    return await writeDocSecurely("tickets", ticketId, tkt);
  }
}
