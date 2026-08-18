export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  FORM_TEACHER: 'FORM_TEACHER',
  BURSAR: 'BURSAR',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  LIBRARIAN: 'LIBRARIAN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const StudentStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  GRADUATED: 'GRADUATED',
  TRANSFERRED: 'TRANSFERRED',
} as const;

export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
} as const;

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const InvoiceStatus = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  MOMO_MTN: 'MOMO_MTN',
  MOMO_TELECEL: 'MOMO_TELECEL',
  MOMO_AT: 'MOMO_AT',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const Priority = {
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const BorrowStatus = {
  BORROWED: 'BORROWED',
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
} as const;

export type BorrowStatus = (typeof BorrowStatus)[keyof typeof BorrowStatus];
