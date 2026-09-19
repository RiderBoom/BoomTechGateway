// Initial first-party knowledge base for BoomTech AI.
// Add reviewed sources here until the Admin upload workflow is introduced.
export const KNOWLEDGE_BASE = [
    {
        id: 'sandbox',
        title: 'BoomTech Sandbox mode',
        text: 'BoomTech Gateway is currently presented as a Sandbox demo. It is for software testing and demonstration. Users should not treat its data or transactions as real financial services.',
    },
    {
        id: 'wallet',
        title: 'Wallet connection',
        text: 'Users connect an EVM wallet in the Wallet tab. Connecting a wallet does not transfer assets. Any wallet signature should be reviewed carefully before approval.',
    },
    {
        id: 'admin',
        title: 'Admin access',
        text: 'Admin access requires the configured owner wallet and Firebase authentication. Admin permissions are issued through a Firebase custom claim after the owner confirms a wallet signature.',
    },
    {
        id: 'treasury',
        title: 'Treasury wallet',
        text: 'The configured BoomTech Treasury wallet is 0x00F0903777B197CF673901b3cc768EA902fb601F. Always verify the address shown in the application before sending assets.',
    },
];

export function findRelevantSources(query, limit = 3) {
    const terms = String(query).toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
    return KNOWLEDGE_BASE
        .map(source => ({
            ...source,
            score: terms.reduce((score, term) => score + (source.text.toLowerCase().includes(term) ? 1 : 0), 0),
        }))
        .filter(source => source.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
