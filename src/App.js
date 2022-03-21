import { utils } from 'ethers'
import whitelistAddresses from './assets/whitelist.json'

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
                <div className="absolute max-w-full inset-0 -z-20 min-h-screen bg-no-repeat bg-[url('./assets/background.png')] bg-cover"></div>
                <div className="flex h-screen z-10">
                    <div className="m-auto">
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
                            <h3 className="text-center text-2xl text-white">Mint Your Metaheroes Club NFT</h3>

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
                                            Mint For {(utils.formatEther(data.cost, 'ether') * mintAmount).toFixed(2)}
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

            {/* FOOTER */}
            <div className="h-32 bg-gradient-to-r from-[#0D0D0D] to-[#2C2C02]">
                <div className="flex justify-center align-middle">&copy;</div>
            </div>

            {/* <>
          {this.isNotMainnet() ? (
              <div className="not-mainnet">
                  You are not connected to the main network.
                  <span className="small">
                      Current network: <strong>{this.state.network?.name}</strong>
                  </span>
              </div>
          ) : null}
      </> */}
        </>
    )
}

export default App
