export interface Account {
    id: string
    email: string
    name: string
    address: string
    is_active: boolean
    is_superuser: boolean
    creation: string | null
    last_update: string | null
    role: 'LENDER' | 'BORROWER'
    tax_id: string
}

export interface NewAccountForm {
    name: string
    email: string
}

export interface Wallet {
    id: string
    name?: string
    address?: string
}

export interface OnboardingStep {
    id: string
    label: string
    number: number
}

export interface CreatedEntity {
    id: string
    account_id?: string
    wallet_id?: string
    wallet_address?: string
    deal_id?: string
    on_off_ramp?: string
    ramping_provider?: string
    l_a_address?: string
    spv_address?: string
    address?: string
    accountName?: string
}

export interface Deal {
    id: string
    creation: string
    name: string
    is_active: boolean
    role: string
}

export interface DealDetails extends Deal {
    sc_version?: string
    chain_id?: string
    // Add other deal detail fields as needed
}

export interface WaterfallConfigResponse {
    deal_id: string
    deal_name: string
    borrowers: Array<{
        id: string
        name: string
        type: string | null
        spv_address: string | null
        l_a_address: string | null
        pool_address: string | null
        wallet_address: string | null
        account_address: string
        waterfall_config: any
    }>
    lenders: Array<{
        id: string
        name: string
        type: string
        spv_address: string | null
        l_a_address: string | null
        pool_address: string | null
        wallet_address: string | null
        account_address: string
        waterfall_config: {
            tranche_id: number
            pool_address: string
            lender_address: string
            tranche_params: any
            borrower_address: string
        }
    }>
}

export type EntityType = 'lender' | 'borrower'
export type AccountRole = 'LENDER' | 'BORROWER'
export type RampingProvider = 'MONERIUM' | 'CIRCLE' 

// Re-export contract types
export * from './contracts'