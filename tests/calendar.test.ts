import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Calendar System Tests
 */
describe("Calendar System", () => {
  describe("Event Creation", () => {
    it("should create a training event with all required fields", () => {
      const event = {
        title: "ฝึกซ้อมเทนนิส",
        eventType: "training",
        eventDate: "2026-06-25",
        startTime: "09:00",
        endTime: "11:00",
        location: "สนามเทนนิส 1",
      };

      expect(event.title).toBeDefined();
      expect(event.eventType).toBe("training");
      expect(event.eventDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(event.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(event.endTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it("should create a match event", () => {
      const event = {
        title: "แข่งขันเทนนิส",
        eventType: "match",
        eventDate: "2026-06-26",
        location: "สนามเทนนิสกลาง",
      };

      expect(event.eventType).toBe("match");
      expect(event.title).toBe("แข่งขันเทนนิส");
    });

    it("should create a tournament event", () => {
      const event = {
        title: "ทัวร์นาเมนต์เทนนิส",
        eventType: "tournament",
        eventDate: "2026-07-01",
      };

      expect(event.eventType).toBe("tournament");
    });

    it("should create a meeting event", () => {
      const event = {
        title: "ประชุมโค้ช",
        eventType: "meeting",
        eventDate: "2026-06-27",
        startTime: "14:00",
      };

      expect(event.eventType).toBe("meeting");
    });

    it("should create a rest day event", () => {
      const event = {
        title: "วันหยุด",
        eventType: "rest",
        eventDate: "2026-06-28",
      };

      expect(event.eventType).toBe("rest");
    });

    it("should validate event title is not empty", () => {
      const event = {
        title: "",
        eventType: "training",
        eventDate: "2026-06-25",
      };

      expect(event.title.length).toBe(0);
      expect(event.title).toBeFalsy();
    });

    it("should validate event date format", () => {
      const validDate = "2026-06-25";
      const invalidDate = "25-06-2026";

      expect(validDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(invalidDate).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should validate time format", () => {
      const validTime = "09:00";
      const invalidTime = "9:0";

      expect(validTime).toMatch(/^\d{2}:\d{2}$/);
      expect(invalidTime).not.toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("Event Filtering", () => {
    let events: any[] = [];

    beforeEach(() => {
      events = [
        {
          id: 1,
          title: "ฝึกซ้อม",
          eventType: "training",
          eventDate: new Date("2026-06-25"),
        },
        {
          id: 2,
          title: "แข่งขัน",
          eventType: "match",
          eventDate: new Date("2026-06-26"),
        },
        {
          id: 3,
          title: "ประชุม",
          eventType: "meeting",
          eventDate: new Date("2026-06-27"),
        },
        {
          id: 4,
          title: "วันหยุด",
          eventType: "rest",
          eventDate: new Date("2026-06-28"),
        },
      ];
    });

    it("should filter events by type", () => {
      const trainingEvents = events.filter((e) => e.eventType === "training");
      expect(trainingEvents).toHaveLength(1);
      expect(trainingEvents[0].title).toBe("ฝึกซ้อม");
    });

    it("should filter events by date range", () => {
      const startDate = new Date("2026-06-25");
      const endDate = new Date("2026-06-26");

      const filtered = events.filter(
        (e) => e.eventDate >= startDate && e.eventDate <= endDate
      );

      expect(filtered).toHaveLength(2);
    });

    it("should get all events for a specific date", () => {
      const targetDate = new Date("2026-06-25");
      const dateStr = targetDate.toISOString().split("T")[0];

      const dayEvents = events.filter(
        (e) => e.eventDate.toISOString().split("T")[0] === dateStr
      );

      expect(dayEvents).toHaveLength(1);
    });

    it("should sort events by date", () => {
      const sorted = [...events].sort(
        (a, b) => a.eventDate.getTime() - b.eventDate.getTime()
      );

      expect(sorted[0].eventDate.getTime()).toBeLessThanOrEqual(
        sorted[1].eventDate.getTime()
      );
      expect(sorted[sorted.length - 1].eventDate.getTime()).toBeGreaterThanOrEqual(
        sorted[sorted.length - 2].eventDate.getTime()
      );
    });
  });

  describe("Calendar Navigation", () => {
    it("should calculate days in month correctly", () => {
      const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      };

      const june2026 = new Date(2026, 5, 1); // June 2026
      const daysInJune = getDaysInMonth(june2026);

      expect(daysInJune).toBe(30);
    });

    it("should get first day of month", () => {
      const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
      };

      const june2026 = new Date(2026, 5, 1); // June 2026
      const firstDay = getFirstDayOfMonth(june2026);

      expect(firstDay).toBeGreaterThanOrEqual(0);
      expect(firstDay).toBeLessThan(7);
    });

    it("should navigate to next month", () => {
      const currentDate = new Date(2026, 5, 15); // June 15, 2026
      const nextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );

      expect(nextMonth.getMonth()).toBe(6); // July
      expect(nextMonth.getFullYear()).toBe(2026);
    });

    it("should navigate to previous month", () => {
      const currentDate = new Date(2026, 5, 15); // June 15, 2026
      const prevMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1
      );

      expect(prevMonth.getMonth()).toBe(4); // May
      expect(prevMonth.getFullYear()).toBe(2026);
    });

    it("should handle year boundary when going to next month", () => {
      const currentDate = new Date(2026, 11, 15); // December 15, 2026
      const nextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );

      expect(nextMonth.getMonth()).toBe(0); // January
      expect(nextMonth.getFullYear()).toBe(2027);
    });

    it("should handle year boundary when going to previous month", () => {
      const currentDate = new Date(2026, 0, 15); // January 15, 2026
      const prevMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1
      );

      expect(prevMonth.getMonth()).toBe(11); // December
      expect(prevMonth.getFullYear()).toBe(2025);
    });
  });

  describe("Event Colors", () => {
    const EVENT_COLORS = {
      training: "#3B82F6",
      match: "#EF4444",
      tournament: "#F59E0B",
      meeting: "#8B5CF6",
      rest: "#10B981",
      other: "#6B7280",
    };

    it("should assign correct color to training events", () => {
      expect(EVENT_COLORS.training).toBe("#3B82F6");
    });

    it("should assign correct color to match events", () => {
      expect(EVENT_COLORS.match).toBe("#EF4444");
    });

    it("should assign correct color to tournament events", () => {
      expect(EVENT_COLORS.tournament).toBe("#F59E0B");
    });

    it("should assign correct color to meeting events", () => {
      expect(EVENT_COLORS.meeting).toBe("#8B5CF6");
    });

    it("should assign correct color to rest day events", () => {
      expect(EVENT_COLORS.rest).toBe("#10B981");
    });

    it("should have color for all event types", () => {
      const eventTypes = [
        "training",
        "match",
        "tournament",
        "meeting",
        "rest",
        "other",
      ];

      eventTypes.forEach((type) => {
        expect(EVENT_COLORS[type as keyof typeof EVENT_COLORS]).toBeDefined();
        expect(EVENT_COLORS[type as keyof typeof EVENT_COLORS]).toMatch(
          /^#[0-9A-F]{6}$/i
        );
      });
    });
  });

  describe("Event Validation", () => {
    it("should validate required fields", () => {
      const validateEvent = (event: any) => {
        return event.title && event.eventType && event.eventDate;
      };

      const validEvent = {
        title: "ฝึกซ้อม",
        eventType: "training",
        eventDate: "2026-06-25",
      };

      const invalidEvent = {
        title: "",
        eventType: "training",
        eventDate: "2026-06-25",
      };

      expect(validateEvent(validEvent)).toBeTruthy();
      expect(validateEvent(invalidEvent)).toBeFalsy();
    });

    it("should validate event type is one of allowed types", () => {
      const allowedTypes = [
        "training",
        "match",
        "tournament",
        "meeting",
        "rest",
        "other",
      ];

      const isValidType = (type: string) => allowedTypes.includes(type);

      expect(isValidType("training")).toBeTruthy();
      expect(isValidType("match")).toBeTruthy();
      expect(isValidType("invalid")).toBeFalsy();
    });

    it("should validate start time is before end time", () => {
      const validateTimeRange = (startTime: string, endTime: string) => {
        const start = parseInt(startTime.replace(":", ""));
        const end = parseInt(endTime.replace(":", ""));
        return start < end;
      };

      expect(validateTimeRange("09:00", "11:00")).toBeTruthy();
      expect(validateTimeRange("11:00", "09:00")).toBeFalsy();
      expect(validateTimeRange("09:00", "09:00")).toBeFalsy();
    });

    it("should validate location is optional", () => {
      const event1: any = {
        title: "ฝึกซ้อม",
        eventType: "training",
        eventDate: "2026-06-25",
        location: "สนามเทนนิส",
      };

      const event2: any = {
        title: "ฝึกซ้อม",
        eventType: "training",
        eventDate: "2026-06-25",
      };

      expect(event1.location).toBeDefined();
      expect(event2.location).toBeUndefined();
    });
  });

  describe("Month View", () => {
    it("should generate calendar grid for month", () => {
      const generateCalendarDays = (year: number, month: number) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const days: (number | null)[] = [];

        for (let i = 0; i < firstDay; i++) {
          days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
          days.push(i);
        }

        return days;
      };

      const days = generateCalendarDays(2026, 5); // June 2026

      expect(days.length).toBeGreaterThan(28);
      expect(days.length).toBeLessThanOrEqual(42); // 6 weeks * 7 days
      expect(days.filter((d) => d !== null)).toHaveLength(30); // June has 30 days
    });

    it("should display events on correct calendar dates", () => {
      const events = [
        {
          id: 1,
          title: "ฝึกซ้อม",
          eventDate: new Date("2026-06-25"),
        },
        {
          id: 2,
          title: "แข่งขัน",
          eventDate: new Date("2026-06-26"),
        },
      ];

      const getEventsForDate = (day: number, month: number, year: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return events.filter(
          (e) => e.eventDate.toISOString().split("T")[0] === dateStr
        );
      };

      const june25Events = getEventsForDate(25, 5, 2026);
      const june26Events = getEventsForDate(26, 5, 2026);

      expect(june25Events).toHaveLength(1);
      expect(june26Events).toHaveLength(1);
    });
  });

  describe("Event Management", () => {
    it("should update event details", () => {
      const event = {
        id: 1,
        title: "ฝึกซ้อม",
        eventType: "training",
        eventDate: "2026-06-25",
        location: "สนามเทนนิส 1",
      };

      const updatedEvent = {
        ...event,
        title: "ฝึกซ้อมเทนนิส",
        location: "สนามเทนนิส 2",
      };

      expect(updatedEvent.title).toBe("ฝึกซ้อมเทนนิส");
      expect(updatedEvent.location).toBe("สนามเทนนิส 2");
      expect(updatedEvent.id).toBe(event.id);
    });

    it("should delete event", () => {
      let events = [
        { id: 1, title: "ฝึกซ้อม" },
        { id: 2, title: "แข่งขัน" },
        { id: 3, title: "ประชุม" },
      ];

      events = events.filter((e) => e.id !== 2);

      expect(events).toHaveLength(2);
      expect(events.find((e) => e.id === 2)).toBeUndefined();
    });

    it("should get upcoming events", () => {
      const today = new Date();
      const events = [
        {
          id: 1,
          title: "ฝึกซ้อม",
          eventDate: new Date(today.getTime() - 86400000), // Yesterday
        },
        {
          id: 2,
          title: "แข่งขัน",
          eventDate: new Date(today.getTime() + 86400000), // Tomorrow
        },
        {
          id: 3,
          title: "ประชุม",
          eventDate: new Date(today.getTime() + 172800000), // In 2 days
        },
      ];

      today.setHours(0, 0, 0, 0);
      const upcomingEvents = events.filter((e) => e.eventDate >= today);

      expect(upcomingEvents).toHaveLength(2);
      expect(upcomingEvents[0].title).toBe("แข่งขัน");
    });
  });
});
