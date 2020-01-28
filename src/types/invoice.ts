
const models = {
  'MOVIE_CURRENCIES': [
    {
      'slug': 'us-dollar',
      'label': 'US dollar',
      'code': 'USD'
    },
    {
      'slug': 'euro',
      'label': 'Euro',
      'code': 'EUR'
    },
    {
      'slug': 'japanese-yen',
      'label': 'Japanese yen',
      'code': 'JPY'
    },
    {
      'slug': 'pound-sterling',
      'label': 'Pound sterling',
      'code': 'GBP'
    },
    {
      'slug': 'australian-dollar',
      'label': 'Australian Dollar',
      'code': 'AUD'
    },
    {
      'slug': 'canadian-dollar',
      'label': 'Canadian Dollar',
      'code': 'CAD'
    },
    {
      'slug': 'swiss-franc',
      'label': 'Swiss Franc',
      'code': 'CHF'
    },
    {
      'slug': 'chinese-renminbi',
      'label': 'Chinese Renminbi',
      'code': 'CNY'
    },
    {
      'slug': 'swedish-krona',
      'label': 'Swedish krona',
      'code': 'SEK'
    },
    {
      'slug': 'new-zealand-dollar',
      'label': 'New Zealand dollar',
      'code': 'NZD'
    }
  ] as const,
}
export const MOVIE_CURRENCIES_SLUG = models['MOVIE_CURRENCIES'].map(key => key.slug);
export type MovieCurrenciesSlug = typeof MOVIE_CURRENCIES_SLUG[number];

export interface ScheduleRaw {
  percentage: number;
  date?: Date;
  label: string;
}

export interface PaymentScheduleRaw extends ScheduleRaw{
  invoiceId ? : string;
}

export interface Fee {
  label: string;
  price: Price;
}

export interface Price {
  amount: number;
  currency: MovieCurrenciesSlug;
  vat?: number; // percentage
  fees?: Fee[];
  commission?: number;
  mg?: Price; // ie: minimun guaranteed
}

export interface BankAccount {
  address: Location;
  IBAN: string;
  BIC: string;
  name: string;
}

export interface InvoiceRaw {
 id: string,
 internalRef: string,
 paymentRef?: string, // @dev should be coming from blockchain data
 creationDate: Date,
 price: Price,
 buyerId: string, // @dev an orgId
 sellerId: string, // @dev an orgId
 paymentSchedule: PaymentScheduleRaw,
 interestRate?: number,
 account: BankAccount, // @dev should be one of the buyerId bank accounts
 contractId: string,
 legalDocumentId: string, // @dev should be a legal document belonging to contractId
}