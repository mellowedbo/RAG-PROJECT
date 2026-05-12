/* ═══════════════════════════════════════════════════════════
   NEXUS — Pre-loaded Demo Documents & Chunks
   ═══════════════════════════════════════════════════════════ */

import type { DocInfo, ChunkInfo } from '@/types';

export const DEMO_DOCUMENTS: DocInfo[] = [
  {
    id: 'demo-tesla-10k',
    title: 'Tesla Inc. — 2024 Annual Report (10-K)',
    filename: 'tesla_2024_10k.txt',
    docType: '10k',
    sector: 'Automotive & Technology',
    wordCount: 487,
    chunkCount: 6,
    status: 'chunked',
    createdAt: '2024-12-31T00:00:00.000Z',
  },
  {
    id: 'demo-goldman-earnings',
    title: 'Goldman Sachs — Q4 2024 Earnings Release',
    filename: 'goldman_sachs_q4_2024.txt',
    docType: 'earnings',
    sector: 'Financial Services',
    wordCount: 412,
    chunkCount: 5,
    status: 'chunked',
    createdAt: '2024-12-31T00:00:00.000Z',
  },
  {
    id: 'demo-jpmorgan-risk',
    title: 'JP Morgan — 2024 Risk Assessment Report',
    filename: 'jpmorgan_2024_risk.txt',
    docType: 'risk_assessment',
    sector: 'Financial Services',
    wordCount: 520,
    chunkCount: 6,
    status: 'chunked',
    createdAt: '2024-12-31T00:00:00.000Z',
  },
];

export const DEMO_CHUNKS: ChunkInfo[] = [
  // Tesla chunks
  { id: 'tc1', documentId: 'demo-tesla-10k', content: 'Tesla, Inc. was incorporated in the State of Delaware on July 1, 2003. We design, develop, manufacture and sell high-performance fully electric vehicles and energy generation and storage systems. As of December 31, 2024, we produced our vehicles at our manufacturing facilities in Fremont, California; Austin, Texas; Shanghai, China; and Berlin, Germany. Revenue for the year ended December 31, 2024 was $96.8 billion, representing an increase of 18% compared to the prior year. Automotive revenues were $78.5 billion, an increase of 15% from 2023. Energy generation and storage revenues were $14.2 billion, an increase of 67% year-over-year.', chunkIndex: 0, section: 'ITEM 1. BUSINESS', wordCount: 82, charCount: 520 },
  { id: 'tc2', documentId: 'demo-tesla-10k', content: 'You should carefully consider the risks described below. We may be subject to legal proceedings, claims and litigation arising in the ordinary course of business, including product liability claims, warranty claims, consumer protection matters, intellectual property matters and employment matters. We may also be subject to governmental investigations and enforcement actions that may adversely affect our business, financial condition, results of operations or cash flows.', chunkIndex: 1, section: 'RISK FACTORS', wordCount: 58, charCount: 380 },
  { id: 'tc3', documentId: 'demo-tesla-10k', content: 'We have identified a material weakness in our internal control over financial reporting related to the design and operating effectiveness of controls over the accuracy and completeness of certain accounting entries and processes. While we are implementing remediation measures, there can be no assurance that our remediation efforts will be successful.', chunkIndex: 2, section: 'RISK FACTORS', wordCount: 48, charCount: 320 },
  { id: 'tc4', documentId: 'demo-tesla-10k', content: 'Our business could be adversely affected by cybersecurity incidents, such as ransomware attacks, data breaches, or other security incidents involving our information technology systems or those of our third-party service providers. Interest rate risk remains a significant factor. A 100 basis point parallel shift in interest rates would result in an estimated $2.8 billion impact on our fixed-income portfolio. Currency risk from our international operations also exposes us to foreign exchange fluctuations.', chunkIndex: 3, section: 'RISK FACTORS', wordCount: 63, charCount: 410 },
  { id: 'tc5', documentId: 'demo-tesla-10k', content: 'Total automotive revenues increased $10.2 billion, or 15%, in 2024 compared to 2023. This increase was primarily due to an increase in total vehicle deliveries, partially offset by a decrease in average selling price. We delivered approximately 1.81 million vehicles in 2024, representing an increase of 7% from 2023. Energy storage deployments reached 31.4 GWh in 2024, representing an increase of 113% from 2023. Gross margin decreased from 18.2% in 2023 to 17.1% in 2024.', chunkIndex: 4, section: 'MD&A', wordCount: 72, charCount: 470 },
  { id: 'tc6', documentId: 'demo-tesla-10k', content: 'We are not in compliance with certain covenants under our credit agreement related to financial reporting deadlines. While we are in discussions with our lenders regarding a waiver, there can be no assurance that such waiver will be obtained on favorable terms, or at all. Forward Guidance: For 2025, we expect vehicle deliveries to grow by 20-25%, energy storage deployments to grow by at least 50%, and total revenue to exceed $110 billion. We anticipate achieving a full-year gross margin of approximately 18-19%.', chunkIndex: 5, section: 'MD&A', wordCount: 70, charCount: 460 },

  // Goldman Sachs chunks
  { id: 'gc1', documentId: 'demo-goldman-earnings', content: 'Net revenues for the fourth quarter of 2024 were $13.9 billion, 23% higher than the fourth quarter of 2023 and 8% higher than the third quarter of 2024. Net earnings for the fourth quarter of 2024 were $4.1 billion, an increase of 105% compared to the fourth quarter of 2023. Net revenues for the full year 2024 were $53.2 billion, 16% higher than 2023. Net earnings for the full year 2024 were $15.3 billion, 68% higher than 2023.', chunkIndex: 0, section: 'FINANCIAL HIGHLIGHTS', wordCount: 72, charCount: 470 },
  { id: 'gc2', documentId: 'demo-goldman-earnings', content: 'Net revenues in Global Banking & Markets were $33.9 billion for 2024, 24% higher than 2023. Investment Banking revenues were $8.2 billion, 24% higher than 2023. FICC revenues were $14.8 billion, essentially unchanged compared to 2023. Equities revenues were $10.9 billion, 21% higher than 2023. Diluted earnings per common share were $42.14 for 2024, compared to $25.39 for 2023. The annualized return on average common shareholders\' equity was 14.3%.', chunkIndex: 1, section: 'FINANCIAL HIGHLIGHTS', wordCount: 72, charCount: 460 },
  { id: 'gc3', documentId: 'demo-goldman-earnings', content: 'We are subject to credit risk from counterparty defaults, which may increase during periods of economic uncertainty or market disruption. Our credit risk exposure is concentrated in financial institutions, sovereign entities, and corporate borrowers. As of December 2024, our total credit exposure was $187 billion. Interest rate risk remains a significant factor affecting our net interest income and the value of our fixed-income portfolios.', chunkIndex: 2, section: 'RISK FACTORS', wordCount: 56, charCount: 370 },
  { id: 'gc4', documentId: 'demo-goldman-earnings', content: 'We are subject to ongoing regulatory investigations by the SEC, CFTC, and other governmental authorities related to our trading practices, compliance with sanctions regulations, and anti-money laundering controls. Our operations are subject to anti-corruption laws, including the FCPA and UK Bribery Act. We have identified certain transactions in our Asia-Pacific operations that may have violated these laws and have voluntarily disclosed these matters to regulators.', chunkIndex: 3, section: 'RISK FACTORS', wordCount: 62, charCount: 410 },
  { id: 'gc5', documentId: 'demo-goldman-earnings', content: 'Cybersecurity risk continues to be a significant concern. We experienced a data breach in Q3 2024 affecting approximately 12,000 client accounts. We identified a related party transaction with an affiliated entity totaling $340 million that was not properly disclosed in prior period financial statements. We have restated our previously issued financial results to correct this disclosure. Our Liquidity Coverage Ratio was 128% as of December 2024, above the 100% regulatory minimum but below our internal target of 135%.', chunkIndex: 4, section: 'RISK FACTORS', wordCount: 70, charCount: 470 },

  // JP Morgan chunks
  { id: 'jc1', documentId: 'demo-jpmorgan-risk', content: 'This report provides a comprehensive assessment of the principal risks facing JP Morgan Chase as of December 31, 2024. Total credit exposure was $1.2 trillion as of December 2024. Our allowance for credit losses was $22.3 billion, representing 1.86% of total loans. The firm\'s credit risk profile has improved modestly over the past year, with non-performing loans declining by 8% to $12.1 billion.', chunkIndex: 0, section: 'CREDIT RISK', wordCount: 58, charCount: 380 },
  { id: 'jc2', documentId: 'demo-jpmorgan-risk', content: 'Credit risk concentration remains elevated in commercial real estate (CRE), where we have $178 billion in total exposure. CRE loan delinquencies increased to 3.2% from 2.1% in the prior year, reflecting stress in the office and retail segments. We have increased our CRE-specific reserve by $1.8 billion to $5.6 billion.', chunkIndex: 1, section: 'CREDIT RISK', wordCount: 46, charCount: 310 },
  { id: 'jc3', documentId: 'demo-jpmorgan-risk', content: 'Value-at-Risk (VaR) at the 99% confidence level was $98 million as of December 2024, compared to $87 million at year-end 2023. The increase reflects higher volatility in interest rate and credit spreads. Our stress testing indicates potential trading losses of up to $18 billion under severely adverse scenarios. A 200 basis point parallel increase in rates would reduce net interest income by approximately $5.4 billion over the next 12 months.', chunkIndex: 2, section: 'MARKET RISK', wordCount: 68, charCount: 450 },
  { id: 'jc4', documentId: 'demo-jpmorgan-risk', content: 'We continue to face significant operational risk from cybersecurity threats, technology failures, and compliance breaches. During 2024, we experienced 14 significant operational loss events totaling $892 million, including a technology failure in payments processing that resulted in $340 million in remediation costs, a data breach affecting 28,000 customer accounts, and regulatory fines of $198 million related to deficiencies in our anti-money laundering monitoring systems.', chunkIndex: 3, section: 'OPERATIONAL RISK', wordCount: 62, charCount: 410 },
  { id: 'jc5', documentId: 'demo-jpmorgan-risk', content: 'We are currently subject to 23 active regulatory investigations and enforcement proceedings. Sanctions compliance: We identified potential violations of OFAC sanctions regulations in our correspondent banking division. Anti-corruption: Our operations in three countries are under investigation for potential violations of the Foreign Corrupt Practices Act (FCPA). Market manipulation: We are defending against allegations of market manipulation in our precious metals trading desk. The aggregate potential financial exposure is estimated at $2.8-4.2 billion.', chunkIndex: 4, section: 'REGULATORY', wordCount: 72, charCount: 490 },
  { id: 'jc6', documentId: 'demo-jpmorgan-risk', content: 'We have identified climate-related financial risk as a growing concern. Our financed emissions portfolio totals approximately 340 million tonnes of CO2 equivalent. Physical risk exposure to climate events is concentrated in our mortgage and CRE portfolios in coastal regions, with estimated potential losses of $8-12 billion under severe climate scenarios over the next decade. For 2025, we anticipate credit costs to increase by 15-20% driven primarily by CRE deterioration.', chunkIndex: 5, section: 'CLIMATE AND ESG RISK', wordCount: 66, charCount: 450 },
];
