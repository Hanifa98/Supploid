export const site = {
  name: 'Supploid', url: 'https://supploid.com', email: 'info@supploid.com', aogEmail: 'aog@supploid.com',
  quoteCommitment: 'Fast quoting, documentation supplied',
  // Deliberately no registration identifiers, street address, public phones, or staff claims.
  privacyRetention: '[TO CONFIRM]',
};
export const navigation = [ ['Our approach', '/quality/'], ['About', '/about/'], ['Insights', '/insights/'], ['Contact', '/contact/'] ];
export const aviationDocs = ['FAA 8130-3', 'EASA Form 1', 'Certificate of Conformance', 'Trace to source', 'Non-incident statement', 'Dual release'];
export const industrialDocs = ['Manufacturer CofC', 'EN 10204 2.1 material documentation', 'EN 10204 3.1 inspection certificate', 'RoHS / REACH declarations'];
export function ogPath(path: string) { return `/og/${path.replace(/^\/+|\/+$/g, '').replaceAll('/', '-') || 'home'}.png`; }
