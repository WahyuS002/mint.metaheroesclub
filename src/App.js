import { connect } from './redux/blockchain/blockchainActions'
import { fetchData } from './redux/data/dataActions'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
    const dispatch = useDispatch()
    const blockchain = useSelector((state) => state.blockchain)
    const data = useSelector((state) => state.data)
    const [claimingNft, setClaimingNft] = useState(false)
    const [mintAmount, setMintAmount] = useState(1)

    const [canIncrementAmount, setCanIncrementAmount] = useState(true)
    const [canDecrementAmount, setCanDecrementAmount] = useState(false)

    const [CONFIG, SET_CONFIG] = useState({
        CONTRACT_ADDRESS: '',
        SCAN_LINK: '',
        MAX_SUPPLY_PER_ADDRESS: '',
        NETWORK: {
            NAME: '',
            SYMBOL: '',
            ID: 0,
        },
        NFT_NAME: '',
        SYMBOL: '',
        MAX_SUPPLY: 1,
        WEI_COST: 0,
        DISPLAY_COST: 0,
        GAS_LIMIT: 0,
        MARKETPLACE: '',
        MARKETPLACE_LINK: '',
        SHOW_BACKGROUND: false,
    })

    const claimNFTs = () => {
        if (data.paused) {
            toast.info('Minting will open soon.')
        } else {
            if (data.currentWalletSupply + mintAmount > CONFIG.MAX_SUPPLY_PER_ADDRESS) {
                toast.warning('You have exceeded the max limit of minting.')
            } else if (parseInt(mintAmount) + parseInt(data.totalSupply) > CONFIG.MAX_SUPPLY) {
                toast.warning('You have exceeded the max limit of minting.')
            } else {
                let cost = data.cost
                let gasLimit = CONFIG.GAS_LIMIT
                let totalCostWei = String(cost * mintAmount)
                let totalGasLimit = String(gasLimit * mintAmount)
                // setFeedback(`Minting your ${CONFIG.NFT_NAME}...`)
                toast.info(`Minting your ${CONFIG.NFT_NAME}...`)
                setClaimingNft(true)
                blockchain.smartContract.methods
                    .mint(mintAmount)
                    .send({
                        gasLimit: String(totalGasLimit),
                        to: CONFIG.CONTRACT_ADDRESS,
                        from: blockchain.account,
                        value: totalCostWei,
                    })
                    .once('error', (err) => {
                        console.log(err)
                        // setFeedback('Sorry, something went wrong please try again later.')
                        toast.error('Sorry, something went wrong please try again later.')
                        setClaimingNft(false)
                    })
                    .then((receipt) => {
                        console.log(receipt)
                        // setFeedback(`WOW, the ${CONFIG.NFT_NAME} is yours! go visit Opensea.io to view it.`)
                        toast.success(`WOW, the ${CONFIG.NFT_NAME} is yours! go visit Opensea.io to view it.`)
                        setClaimingNft(false)
                        dispatch(fetchData(blockchain.account))
                    })
            }
        }
    }

    const decrementMintAmount = () => {
        let newMintAmount = mintAmount - 1
        if (newMintAmount === 1) {
            setCanDecrementAmount(false)
        }
        if (newMintAmount < 1) {
            newMintAmount = 1
        }
        setMintAmount(newMintAmount)
        setCanIncrementAmount(true)
    }

    const incrementMintAmount = () => {
        let newMintAmount = mintAmount + 1
        if (newMintAmount === 20) {
            setCanIncrementAmount(false)
        }
        if (newMintAmount > 20) {
            newMintAmount = 20
        }
        setMintAmount(newMintAmount)
        setCanDecrementAmount(true)
    }

    const getData = () => {
        if (blockchain.account !== '' && blockchain.smartContract !== null) {
            dispatch(fetchData(blockchain.account))
        }
    }

    const getConfig = async () => {
        const configResponse = await fetch('/config/config.json', {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        })
        const config = await configResponse.json()
        SET_CONFIG(config)
    }

    useEffect(() => {
        getConfig()
    }, [])

    useEffect(() => {
        getData()
    }, [blockchain.account])

    return (
        <div className="font-grandstander selection:bg-purple-500">
            <ToastContainer />
            {claimingNft && (
                <div className="flex h-screen bg-black/70 backdrop-blur-3xl absolute w-full z-10">
                    <div className="m-auto text-white">
                        <div className="flex justify-center mb-5">{/* <Loading /> */}</div>
                        <h4 className="text-xl">Mint in Progress...</h4>
                    </div>
                </div>
            )}
            <div className="relative">
                <div className="w-4/5 mx-auto">
                    <div className="flex flex-col-reverse md:flex-row md:h-screen">
                        <div className="m-auto md:w-1/2">
                            <div className="flex justify-center">{/* <img src={logo} alt="Logo" draggable={false} /> */}</div>
                            <div className="flex flex-col items-center ml-auto md:mt-8">
                                <div>
                                    <div className="flex flex-wrap items-center space-x-5">
                                        <div
                                            className="relative cursor-pointer hover:-mt-1 transition-all duration-150 ease-in-out"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                decrementMintAmount()
                                            }}
                                        >
                                            <span className="absolute top-2 md:top-5 right-4 md:right-8">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <h2
                                                className={`absolute text-4xl md:text-5xl top-4 md:top-6 ${
                                                    mintAmount >= 10 ? 'left-10 md:left-20' : 'left-[4rem] md:left-[5.5rem]'
                                                } text-gray-800 font-bold`}
                                            >
                                                {mintAmount}
                                            </h2>
                                        </div>
                                        <div
                                            className="relative cursor-pointer hover:-mt-1 transition-all duration-150 ease-in-out"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                incrementMintAmount()
                                            }}
                                        >
                                            <span className="absolute top-2 md:top-5 right-3 md:right-8">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <div className="cursor-pointer relative hover:-mt-1 transition-all duration-150 ease-in-out group">
                                        {blockchain.account === '' || blockchain.smartContract === null ? (
                                            <>
                                                <div
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        dispatch(connect())
                                                        getData()
                                                    }}
                                                >
                                                    <h3 className="absolute top-6 left-7 text-3xl text-gray-800 group-hover:text-gray-900 transition-all duration-200 ease-in-out font-semibold">
                                                        Connect
                                                    </h3>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {data.loading ? (
                                                    <div
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            dispatch(connect())
                                                            getData()
                                                        }}
                                                    >
                                                        <h3 className="absolute top-6 left-6 text-3xl text-gray-800 group-hover:text-gray-900 transition-all duration-200 ease-in-out font-semibold">
                                                            Loading...
                                                        </h3>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            claimNFTs()
                                                            getData()
                                                        }}
                                                    >
                                                        <h3 className="absolute top-6 left-6 text-3xl text-gray-800 group-hover:text-gray-900 transition-all duration-200 ease-in-out font-semibold">
                                                            Mint Now
                                                        </h3>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="md:w-1/2 mt-36 mb-14 md:m-auto">
                            <div className="ml-auto w-[95%] md:w-[75%] relative"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
