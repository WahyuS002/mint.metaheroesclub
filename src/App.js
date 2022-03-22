import { utils } from 'ethers'
import whitelistAddresses from './assets/whitelist.json'
import logoYellow from './assets/logo-yellow.png'
import backgroundImg from './assets/background.png'

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
            console.log('Current Wallet Supply : ', data.currentWalletSupply)
            if (data.currentWalletSupply + mintAmount > data.maxMintAmountPerTx) {
                toast.warning('You have exceeded the max limit of minting.')
            } else if (parseInt(mintAmount) + parseInt(data.totalSupply) > data.maxSupply) {
                toast.warning('You have exceeded the max limit of minting.')
            } else {
                if (data.isWhitelistMintEnabled) {
                    whitelistAddresses.some((element) => {
                        if (element.toLowerCase() === blockchain.account.toLowerCase()) {
                            return minting()
                        } else {
                            toast.error('This address is not whitelisted')
                        }
                    })
                } else {
                    minting()
                }
            }
        }
    }

    const minting = () => {
        let cost = data.cost
        let gasLimit = CONFIG.GAS_LIMIT
        let totalCostWei = String(cost * mintAmount)
        let totalGasLimit = String(gasLimit * mintAmount)
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
                toast.error('Sorry, something went wrong please try again later.')
                setClaimingNft(false)
            })
            .then((receipt) => {
                console.log(receipt)
                toast.success(`WOW, the ${CONFIG.NFT_NAME} is yours! go visit Opensea.io to view it.`)
                setClaimingNft(false)
                dispatch(fetchData(blockchain.account))
            })
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
        if (newMintAmount === data.maxMintAmountPerTx) {
            setCanIncrementAmount(false)
        }
        if (newMintAmount > data.maxMintAmountPerTx) {
            newMintAmount = data.maxMintAmountPerTx
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

    const isWalletConnected = () => {
        return blockchain.account === '' || blockchain.smartContract === null
    }

    const isContractReady = () => {
        return blockchain.account && !data.loading
    }

    useEffect(() => {
        getConfig()
    }, [])

    useEffect(() => {
        getData()
    }, [blockchain.account])

    return (
        <>
            <ToastContainer />
            <div className="min-h-screen font-caveat-brush selection:bg-primary selection:text-gray-800">
                <a href="https://metaheroesclub.com/" target={'_blank'} className="flex justify-center relative" rel="noreferrer">
                    <img className="absolute w-96 p-5 top-14" draggable={false} src={logoYellow} alt="Logo Yellow" />
                </a>
                <div className="hidden md:block">
                    <div className="absolute max-w-full inset-0 -z-20 min-h-screen bg-no-repeat bg-[url('./assets/background.png')] bg-cover"></div>
                </div>
                <div className="block md:hidden mt-12">
                    <div className="bg-[#0D0D0D] min-h-screen -z-20 absolute inset-0">
                        <p className="text-white absolute bottom-0">
                            <img src={backgroundImg} alt="Background_Image" />
                        </p>
                    </div>
                </div>
                <div className="flex h-screen z-10">
                    <div className="m-auto">
                        <div className="mt-16">
                            {blockchain.account && !data.loading ? (
                                <div className="flex justify-center mb-5">
                                    <div className="bg-[#212226] border-2 border-[#3E3E3E] px-2 py-1 rounded-full inline-block">
                                        <div className="flex items-center space-x-2">
                                            {data.paused ? <span className="w-3 h-3 rounded-full bg-red-500"></span> : <span className="w-3 h-3 rounded-full bg-green-400"></span>}

                                            <span className="font-poppins text-xs uppercase font-medium text-gray-300">
                                                {data.paused ? 'Paused' : <>{data.isWhitelistMintEnabled ? 'Whitelist Minting' : 'Public Minting'}</>}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            <div className="px-16 py-10 bg-[#2C2D31] space-y-7 rounded-3xl border-2 border-[#3E3E3E]">
                                <h3 className="text-center text-2xl text-white">Mint your Metaheroes Club NFT</h3>

                                {/* MINT WIDGET START */}
                                <>
                                    <div className="flex justify-center space-x-5 select-none">
                                        <div className="flex items-center">
                                            <div
                                                className={
                                                    (isContractReady() ? 'bg-primary hover:bg-yellow-400 transition-all duration-300 ease-in-out cursor-pointer' : 'bg-gray-200 cursor-not-allowed') +
                                                    ' w-8 h-8 border-2 border-white rounded-lg relative'
                                                }
                                                onClick={() => (isContractReady() ? decrementMintAmount() : null)}
                                            >
                                                <span className="text-3xl absolute -bottom-[0.15rem] left-[0.35rem] text-gray-800">-</span>
                                            </div>
                                        </div>
                                        <span className="text-5xl text-white">{mintAmount}</span>
                                        <div className="flex items-center">
                                            <div
                                                className={
                                                    (isContractReady() ? 'bg-primary hover:bg-yellow-400 transition-all duration-300 ease-in-out cursor-pointer' : 'bg-gray-200 cursor-not-allowed') +
                                                    ' w-8 h-8 border-2 border-white rounded-lg relative'
                                                }
                                                onClick={() => (isContractReady() ? incrementMintAmount() : null)}
                                            >
                                                <span className="text-3xl absolute -bottom-[0.15rem] left-[0.35rem] text-gray-800">+</span>
                                            </div>
                                        </div>
                                    </div>
                                    {isContractReady() ? (
                                        <div className="flex justify-center">
                                            <button
                                                className="bg-primary hover:bg-yellow-400 transition-all duration-300 ease-in-out hover:text-black px-12 py-2 rounded-xl text-3xl text-gray-800 border-4 border-white"
                                                onClick={() => claimNFTs()}
                                            >
                                                Mint For {(utils.formatEther(data.cost, 'ether') * mintAmount).toFixed(3).replace(/(\.0+|0+)$/, '')}
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                                {/* MINT WIDGET END */}

                                {blockchain.account === '' || blockchain.smartContract === null ? (
                                    <div className="flex justify-center">
                                        <button
                                            className="bg-primary hover:bg-yellow-400 transition-all duration-300 ease-in-out hover:text-black px-12 py-2 rounded-xl text-3xl text-gray-800 border-4 border-white"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                dispatch(connect())
                                                getData()
                                            }}
                                        >
                                            Connect Wallet
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {data.loading ? (
                                            <div className="flex justify-center">
                                                <button className="bg-primary hover:bg-yellow-400 transition-all duration-300 ease-in-out hover:text-black px-12 py-2 rounded-xl text-3xl text-gray-800 border-4 border-white">
                                                    Loading . . .
                                                </button>
                                            </div>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="h-32 bg-gradient-to-r from-[#0D0D0D] to-[#2C2C02] relative">
                <div className="flex justify-center">
                    <div className="mt-8 flex justify-center items-center space-x-7">
                        <a href="https://twitter.com/metaheroesclub" target={'_blank'} rel="noreferrer">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                class="bi bi-twitter h-6 w-6 fill-current hover:text-primary transition-all duration-300 ease-in-out cursor-pointer text-gray-400"
                                viewBox="0 0 16 16"
                            >
                                <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"></path>
                            </svg>
                        </a>
                        <a href="https://discord.gg/Z9bZ3VZRZQ" target={'_blank'} rel="noreferrer">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                className="text-gray-400 hover:text-primary transition-all duration-300 ease-in-out cursor-pointer"
                                width="120"
                                height="60"
                            >
                                <path d="M21.864 27.445c-.913 0-1.634.785-1.634 1.762s.737 1.762 1.634 1.762c.913 0 1.634-.785 1.634-1.762s-.737-1.762-1.634-1.762zm-5.847 0c-.913 0-1.634.785-1.634 1.762s.737 1.762 1.634 1.762c.913 0 1.634-.785 1.634-1.762.016-.977-.72-1.762-1.634-1.762zM29.65 14.117H8.184A3.29 3.29 0 0 0 4.9 17.401v21.465a3.29 3.29 0 0 0 3.284 3.284H26.35l-.85-2.93 2.05 1.9 1.938 1.778 3.46 2.996V17.4c-.016-1.8-1.5-3.284-3.3-3.284zM23.467 34.86L22.4 33.58c2.098-.593 2.9-1.9 2.9-1.9a9.15 9.15 0 0 1-1.842.945c-.8.336-1.57.545-2.323.7-1.538.288-2.947.208-4.15-.016-.913-.176-1.698-.416-2.355-.7-.368-.144-.77-.32-1.17-.545-.048-.032-.096-.048-.144-.08-.032-.016-.048-.032-.064-.032l-.45-.272s.77 1.265 2.803 1.874l-1.073 1.314c-3.54-.112-4.886-2.42-4.886-2.42 0-5.1 2.307-9.26 2.307-9.26 2.307-1.714 4.485-1.666 4.485-1.666l.16.192c-2.883.817-4.197 2.082-4.197 2.082s.352-.192.945-.45c1.714-.753 3.076-.945 3.636-1 .096-.016.176-.032.272-.032a13.57 13.57 0 0 1 3.236-.032c1.522.176 3.156.625 4.822 1.522 0 0-1.265-1.2-4-2.018l.224-.256s2.195-.048 4.485 1.666c0 0 2.307 4.15 2.307 9.26 0-.016-1.346 2.3-4.886 2.403zm19.267-11.865h-5.238v5.885l3.487 3.14v-5.7h1.862c1.183 0 1.767.568 1.767 1.483v4.37c0 .915-.552 1.53-1.767 1.53H37.48v3.33h5.238c2.808.016 5.443-1.388 5.443-4.607v-4.7C48.177 24.434 45.54 23 42.734 23zm27.45 9.42v-4.828c0-1.735 3.124-2.13 4.07-.394l2.887-1.167c-1.136-2.493-3.203-3.218-4.922-3.218-2.808 0-5.585 1.625-5.585 4.78v4.828c0 3.187 2.777 4.78 5.522 4.78a5.63 5.63 0 0 0 5.048-3.14l-3.092-1.42c-.757 1.94-3.928 1.467-3.928-.22zM60.64 28.25c-1.1-.237-1.814-.63-1.862-1.3.063-1.625 2.572-1.688 4.04-.126l2.32-1.783c-1.45-1.767-3.092-2.24-4.78-2.24-2.572 0-5.064 1.45-5.064 4.197 0 2.666 2.05 4.102 4.307 4.45 1.152.158 2.43.615 2.398 1.404-.095 1.5-3.187 1.42-4.6-.284l-2.24 2.098c1.3 1.688 3.092 2.54 4.765 2.54 2.572 0 5.427-1.483 5.538-4.197.158-3.424-2.335-4.3-4.828-4.75zm-10.57 8.756h3.534v-14H50.07zm59.588-14h-5.238v5.885l3.487 3.14v-5.7h1.862c1.183 0 1.767.568 1.767 1.483v4.37c0 .915-.552 1.53-1.767 1.53h-5.364v3.33h5.254c2.808.016 5.443-1.388 5.443-4.607v-4.7c0-3.282-2.635-4.717-5.443-4.717zm-25.7-.2c-2.903 0-5.8 1.578-5.8 4.812v4.78C78.168 35.6 81.07 37.2 84 37.2c2.903 0 5.8-1.6 5.8-4.812v-4.78c0-3.218-2.92-4.812-5.822-4.812zm2.272 9.592c0 1-1.136 1.53-2.256 1.53-1.136 0-2.272-.5-2.272-1.53v-4.78c0-1.025 1.104-1.578 2.2-1.578 1.152 0 2.32.5 2.32 1.578zm16.234-4.78c-.08-3.282-2.32-4.607-5.206-4.607h-5.6v14h3.58v-4.45h.63l3.25 4.45h4.417L99.72 32.2c1.688-.536 2.745-2.004 2.745-4.6zM97.32 29.5h-2.083v-3.203h2.083c2.224 0 2.224 3.203 0 3.203z" />
                            </svg>
                        </a>
                    </div>
                </div>
                <div className="flex justify-center align-middle font-caveat-brush text-gray-400">
                    <span className="absolute bottom-0 text-lg">&copy; 2022 All Rights Reserved</span>
                </div>
            </div>
        </>
    )
}

export default App
