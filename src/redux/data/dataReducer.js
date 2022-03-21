const initialState = {
    loading: false,
    totalSupply: 0,
    cost: 0,
    error: false,
    errorMsg: '',
    paused: false,
    maxMintAmountPerTx: 0,
    isWhitelistMintEnabled: false,
    currentWalletSupply: 0,
    maxSupply: 0,
}

const dataReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'CHECK_DATA_REQUEST':
            return {
                ...state,
                loading: true,
                error: false,
                errorMsg: '',
            }
        case 'CHECK_DATA_SUCCESS':
            return {
                ...state,
                loading: false,
                totalSupply: action.payload.totalSupply,
                cost: action.payload.cost,
                error: false,
                errorMsg: '',
                paused: action.payload.paused,
                maxMintAmountPerTx: action.payload.maxMintAmountPerTx,
                isWhitelistMintEnabled: action.payload.isWhitelistMintEnabled,
                currentWalletSupply: action.payload.currentWalletSupply,
                maxSupply: action.payload.maxSupply,
            }
        case 'CHECK_DATA_FAILED':
            return {
                ...initialState,
                loading: false,
                error: true,
                errorMsg: action.payload,
            }
        default:
            return state
    }
}

export default dataReducer
