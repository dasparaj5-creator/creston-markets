export interface PlanDisplay {
  name: string;
  minDeposit: number;
  allocation: string;
  withdrawal: string;
  support: string;
  reporting: string;
  popular?: boolean;
}

export const PLANS_DISPLAY: PlanDisplay[] = [
  {
    name: "Bronze",
    minDeposit: 200,
    allocation: "Standard",
    withdrawal: "Monthly",
    support: "Email",
    reporting: "Monthly Statement",
    popular: true,
  },
  {
    name: "Silver",
    minDeposit: 350,
    allocation: "Priority",
    withdrawal: "Bi-weekly",
    support: "Priority Email",
    reporting: "Weekly Statement",
  },
  {
    name: "Gold",
    minDeposit: 500,
    allocation: "Premium",
    withdrawal: "Weekly",
    support: "Dedicated",
    reporting: "Real-time Dashboard",
  },
];
