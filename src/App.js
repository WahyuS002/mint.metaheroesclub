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
                <div className="block md:hidden md:mt-12">
                    <div className="bg-[#0D0D0D] min-h-screen -z-20 absolute inset-0">
                        <p className="text-white absolute bottom-0">
                            <img src={backgroundImg} alt="Background_Image" />
                        </p>
                    </div>
                </div>
                <div className="flex h-screen z-10">
                    <div className="m-auto">
                        <div className="md:mt-16">
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
            <div className="h-48 bg-gradient-to-r from-[#0D0D0D] to-[#2C2C02] relative">
                <div className="flex justify-center">
                    <div className="mt-8 flex justify-center items-center space-x-7">
                        <a href="/">
                            <svg
                                className="fill-current text-gray-400 hover:text-primary transition-all duration-300 ease-in-out cursor-pointer w-36"
                                viewBox="0 0 437 100"
                                fill="current"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M100 50C100 77.6127 77.6127 100 50 100C22.3873 100 0 77.6127 0 50C0 22.3873 22.3873 0 50 0C77.6185 0 100 22.3873 100 50Z" />
                                <path
                                    d="M24.6679 51.6801L24.8836 51.341L37.8906 30.9932C38.0807 30.6953 38.5276 30.7261 38.6714 31.0497C40.8444 35.9196 42.7194 41.9762 41.841 45.7468C41.466 47.2982 40.4386 49.3992 39.2827 51.341C39.1338 51.6236 38.9694 51.901 38.7947 52.1681C38.7125 52.2914 38.5738 52.3633 38.4248 52.3633H25.048C24.6884 52.3633 24.4778 51.9729 24.6679 51.6801Z"
                                    fill="white"
                                />
                                <path
                                    d="M82.6444 55.461V58.6819C82.6444 58.8668 82.5314 59.0312 82.367 59.1031C81.3602 59.5346 77.9132 61.1168 76.48 63.11C72.8224 68.2008 70.0279 75.48 63.7812 75.48H37.721C28.4847 75.48 21 67.9697 21 58.7024V58.4045C21 58.1579 21.2003 57.9576 21.4469 57.9576H35.9745C36.2621 57.9576 36.4727 58.2247 36.4471 58.5072C36.3443 59.4524 36.519 60.4182 36.9659 61.2966C37.8289 63.0484 39.6166 64.1426 41.5481 64.1426H48.74V58.5278H41.6303C41.2656 58.5278 41.0499 58.1065 41.2605 57.8086C41.3375 57.6904 41.4249 57.5672 41.5173 57.4285C42.1903 56.473 43.1509 54.9884 44.1064 53.2983C44.7588 52.1579 45.3906 50.9404 45.8992 49.7178C46.002 49.4969 46.0841 49.2708 46.1663 49.0499C46.305 48.6595 46.4489 48.2948 46.5516 47.9301C46.6544 47.6218 46.7365 47.2982 46.8187 46.9951C47.0602 45.9574 47.1629 44.8581 47.1629 43.7177C47.1629 43.2708 47.1424 42.8033 47.1013 42.3564C47.0807 41.8684 47.0191 41.3803 46.9574 40.8923C46.9163 40.4608 46.8393 40.0344 46.7571 39.5875C46.6544 38.9351 46.5105 38.2879 46.3461 37.6354L46.2896 37.3889C46.1663 36.9419 46.0636 36.5156 45.9198 36.0687C45.5139 34.6662 45.0465 33.2998 44.5533 32.0207C44.3735 31.5121 44.168 31.0241 43.9625 30.5361C43.6595 29.8015 43.3512 29.1337 43.0687 28.5018C42.9249 28.2141 42.8016 27.9521 42.6783 27.685C42.5396 27.3819 42.3958 27.0788 42.2519 26.7912C42.1492 26.5703 42.031 26.3648 41.9488 26.1593L41.0704 24.536C40.9471 24.3151 41.1526 24.0531 41.394 24.1199L46.8907 25.6096H46.9061C46.9163 25.6096 46.9215 25.6148 46.9266 25.6148L47.6509 25.8151L48.4472 26.0412L48.74 26.1233V22.8562C48.74 21.2791 50.0037 20 51.5654 20C52.3462 20 53.0551 20.3185 53.5637 20.8373C54.0722 21.3562 54.3907 22.0651 54.3907 22.8562V27.7056L54.9764 27.8699C55.0226 27.8854 55.0688 27.9059 55.1099 27.9367C55.2538 28.0446 55.4592 28.2038 55.7212 28.3991C55.9267 28.5634 56.1476 28.7638 56.4147 28.9693C56.9438 29.3956 57.5757 29.9453 58.2692 30.5772C58.4541 30.7364 58.6339 30.9008 58.7983 31.0652C59.6922 31.8974 60.6939 32.8734 61.6494 33.9522C61.9165 34.2553 62.1785 34.5635 62.4456 34.8871C62.7127 35.2159 62.9953 35.5395 63.2418 35.8632C63.5655 36.2947 63.9148 36.7416 64.2179 37.2091C64.3617 37.43 64.5261 37.656 64.6648 37.8769C65.0552 38.4676 65.3994 39.079 65.7282 39.6903C65.8669 39.9728 66.0107 40.281 66.134 40.5841C66.4987 41.4009 66.7864 42.2331 66.9713 43.0653C67.0278 43.2451 67.0689 43.4403 67.0895 43.615V43.6561C67.1511 43.9026 67.1717 44.1646 67.1922 44.4317C67.2744 45.2845 67.2333 46.1372 67.0484 46.9951C66.9713 47.3599 66.8686 47.704 66.7453 48.0688C66.622 48.4181 66.4987 48.7828 66.3395 49.127C66.0313 49.841 65.6665 50.5551 65.235 51.2229C65.0963 51.4695 64.9319 51.7315 64.7675 51.9781C64.5877 52.24 64.4028 52.4866 64.2384 52.7281C64.0124 53.0363 63.771 53.3599 63.5244 53.6476C63.3035 53.9507 63.0775 54.2538 62.8309 54.5209C62.4867 54.9267 62.1579 55.312 61.8137 55.6819C61.6083 55.9233 61.3874 56.1699 61.1613 56.3908C60.9405 56.6373 60.7144 56.8582 60.5089 57.0637C60.1648 57.4079 59.8771 57.675 59.6356 57.8959L59.0706 58.4148C58.9884 58.4867 58.8805 58.5278 58.7675 58.5278H54.3907V64.1426H59.8976C61.1305 64.1426 62.3018 63.7059 63.247 62.9045C63.5706 62.622 64.9833 61.3994 66.6528 59.5552C66.7093 59.4935 66.7813 59.4473 66.8635 59.4268L82.0742 55.0295C82.3568 54.9473 82.6444 55.163 82.6444 55.461Z"
                                    fill="white"
                                />
                                <path
                                    d="M148.723 73.9966C144.203 73.9966 140.048 72.9837 136.259 70.9579C132.515 68.932 129.524 66.1135 127.287 62.5023C125.096 58.847 124 54.7513 124 50.2153C124 45.6792 125.096 41.6055 127.287 37.9943C129.524 34.3831 132.515 31.5645 136.259 29.5387C140.048 27.5129 144.203 26.5 148.723 26.5C153.243 26.5 157.375 27.5129 161.119 29.5387C164.909 31.5645 167.876 34.3831 170.022 37.9943C172.214 41.6055 173.309 45.6792 173.309 50.2153C173.309 54.7513 172.214 58.847 170.022 62.5023C167.831 66.1135 164.863 68.932 161.119 70.9579C157.375 72.9837 153.243 73.9966 148.723 73.9966ZM148.723 63.6913C152.558 63.6913 155.617 62.4582 157.9 59.992C160.229 57.5258 161.393 54.2669 161.393 50.2153C161.393 46.1196 160.229 42.8607 157.9 40.4385C155.617 37.9723 152.558 36.7392 148.723 36.7392C144.842 36.7392 141.738 37.9503 139.409 40.3724C137.126 42.7946 135.985 46.0755 135.985 50.2153C135.985 54.3109 137.126 57.5919 139.409 60.0581C141.738 62.4803 144.842 63.6913 148.723 63.6913Z"
                                    fill="current"
                                />
                                <path
                                    d="M191.536 41.8918C192.677 40.1743 194.252 38.787 196.261 37.7301C198.27 36.6731 200.621 36.1446 203.315 36.1446C206.465 36.1446 209.319 36.9153 211.876 38.4567C214.432 39.9981 216.441 42.2001 217.902 45.0626C219.409 47.9252 220.162 51.2502 220.162 55.0376C220.162 58.825 219.409 62.172 217.902 65.0786C216.441 67.9412 214.432 70.1651 211.876 71.7506C209.319 73.292 206.465 74.0626 203.315 74.0626C200.667 74.0626 198.316 73.5342 196.261 72.4772C194.252 71.4203 192.677 70.0551 191.536 68.3815V84.5H179.825V36.6731H191.536V41.8918ZM208.246 55.0376C208.246 52.2191 207.424 50.0171 205.78 48.4317C204.182 46.8022 202.196 45.9875 199.822 45.9875C197.494 45.9875 195.508 46.8022 193.864 48.4317C192.266 50.0611 191.467 52.2851 191.467 55.1036C191.467 57.9222 192.266 60.1462 193.864 61.7756C195.508 63.4051 197.494 64.2198 199.822 64.2198C202.151 64.2198 204.137 63.4051 205.78 61.7756C207.424 60.1021 208.246 57.8561 208.246 55.0376Z"
                                    fill="current"
                                />
                                <path
                                    d="M262.329 54.5091C262.329 55.5661 262.261 56.667 262.124 57.8121H235.62C235.803 60.1021 236.556 61.8637 237.88 63.0968C239.25 64.2859 240.916 64.8804 242.88 64.8804C245.802 64.8804 247.833 63.6913 248.975 61.3132H261.439C260.8 63.7354 259.636 65.9153 257.946 67.8531C256.303 69.7908 254.225 71.3102 251.714 72.4112C249.203 73.5121 246.395 74.0626 243.291 74.0626C239.547 74.0626 236.214 73.292 233.292 71.7506C230.37 70.2092 228.087 68.0072 226.443 65.1446C224.8 62.2821 223.978 58.9351 223.978 55.1036C223.978 51.2722 224.777 47.9252 226.375 45.0626C228.018 42.2001 230.301 39.9981 233.223 38.4567C236.145 36.9153 239.501 36.1446 243.291 36.1446C246.989 36.1446 250.276 36.8933 253.152 38.3907C256.029 39.888 258.266 42.0239 259.864 44.7984C261.508 47.5729 262.329 50.8098 262.329 54.5091ZM250.345 51.5364C250.345 49.5987 249.66 48.0573 248.29 46.9123C246.92 45.7673 245.208 45.1948 243.154 45.1948C241.19 45.1948 239.524 45.7453 238.154 46.8462C236.83 47.9472 236.008 49.5106 235.689 51.5364H250.345Z"
                                    fill="current"
                                />
                                <path
                                    d="M291.793 36.2768C296.267 36.2768 299.828 37.686 302.476 40.5046C305.17 43.279 306.517 47.1105 306.517 51.9989V73.5342H294.874V53.5182C294.874 51.052 294.212 49.1363 292.888 47.7711C291.564 46.4058 289.784 45.7232 287.547 45.7232C285.309 45.7232 283.529 46.4058 282.205 47.7711C280.881 49.1363 280.219 51.052 280.219 53.5182V73.5342H268.508V36.6731H280.219V41.5615C281.406 39.932 283.004 38.6549 285.013 37.7301C287.021 36.7612 289.281 36.2768 291.793 36.2768Z"
                                    fill="current"
                                />
                                <path
                                    d="M332.05 73.9966C328.535 73.9966 325.384 73.4461 322.599 72.3451C319.814 71.2441 317.577 69.6147 315.888 67.4567C314.244 65.2988 313.376 62.7005 313.285 59.6617H325.749C325.932 61.3793 326.548 62.7005 327.599 63.6253C328.649 64.5061 330.018 64.9465 331.708 64.9465C333.443 64.9465 334.812 64.5721 335.817 63.8235C336.821 63.0308 337.324 61.9518 337.324 60.5866C337.324 59.4415 336.913 58.4947 336.091 57.746C335.315 56.9973 334.333 56.3808 333.146 55.8964C332.004 55.4119 330.361 54.8614 328.215 54.2449C325.11 53.32 322.576 52.3952 320.613 51.4704C318.65 50.5456 316.961 49.1803 315.545 47.3747C314.13 45.5691 313.422 43.213 313.422 40.3064C313.422 35.9905 315.043 32.6215 318.285 30.1993C321.526 27.7331 325.749 26.5 330.954 26.5C336.251 26.5 340.519 27.7331 343.761 30.1993C347.003 32.6215 348.738 36.0125 348.966 40.3724H336.296C336.205 38.8751 335.634 37.708 334.584 36.8713C333.534 35.9905 332.187 35.5501 330.543 35.5501C329.128 35.5501 327.987 35.9244 327.119 36.6731C326.252 37.3777 325.818 38.4127 325.818 39.7779C325.818 41.2752 326.548 42.4423 328.01 43.279C329.471 44.1158 331.753 45.0186 334.858 45.9875C337.963 47.0004 340.474 47.9692 342.391 48.8941C344.355 49.8189 346.044 51.1621 347.459 52.9237C348.875 54.6853 349.582 56.9533 349.582 59.7278C349.582 62.3702 348.875 64.7703 347.459 66.9282C346.09 69.0862 344.081 70.8037 341.433 72.0809C338.785 73.358 335.657 73.9966 332.05 73.9966Z"
                                    fill="current"
                                />
                                <path
                                    d="M392.813 54.5091C392.813 55.5661 392.744 56.667 392.607 57.8121H366.103C366.286 60.1021 367.039 61.8637 368.363 63.0968C369.733 64.2859 371.4 64.8804 373.363 64.8804C376.285 64.8804 378.317 63.6913 379.458 61.3132H391.922C391.283 63.7354 390.119 65.9153 388.43 67.8531C386.786 69.7908 384.709 71.3102 382.197 72.4112C379.686 73.5121 376.878 74.0626 373.774 74.0626C370.03 74.0626 366.697 73.292 363.775 71.7506C360.853 70.2092 358.57 68.0072 356.926 65.1446C355.283 62.2821 354.461 58.9351 354.461 55.1036C354.461 51.2722 355.26 47.9252 356.858 45.0626C358.501 42.2001 360.784 39.9981 363.706 38.4567C366.628 36.9153 369.984 36.1446 373.774 36.1446C377.472 36.1446 380.759 36.8933 383.636 38.3907C386.512 39.888 388.749 42.0239 390.347 44.7984C391.991 47.5729 392.813 50.8098 392.813 54.5091ZM380.828 51.5364C380.828 49.5987 380.143 48.0573 378.773 46.9123C377.403 45.7673 375.691 45.1948 373.637 45.1948C371.674 45.1948 370.007 45.7453 368.637 46.8462C367.313 47.9472 366.491 49.5106 366.172 51.5364H380.828Z"
                                    fill="current"
                                />
                                <path
                                    d="M396.662 55.0376C396.662 51.2502 397.393 47.9252 398.854 45.0626C400.36 42.2001 402.392 39.9981 404.949 38.4567C407.506 36.9153 410.359 36.1446 413.51 36.1446C416.203 36.1446 418.555 36.6731 420.564 37.7301C422.618 38.787 424.193 40.1743 425.289 41.8918V36.6731H437V73.5342H425.289V68.3155C424.148 70.033 422.55 71.4203 420.495 72.4772C418.486 73.5342 416.135 74.0626 413.441 74.0626C410.336 74.0626 407.506 73.292 404.949 71.7506C402.392 70.1651 400.36 67.9412 398.854 65.0786C397.393 62.172 396.662 58.825 396.662 55.0376ZM425.289 55.1036C425.289 52.2851 424.467 50.0611 422.824 48.4317C421.226 46.8022 419.262 45.9875 416.934 45.9875C414.605 45.9875 412.619 46.8022 410.976 48.4317C409.378 50.0171 408.579 52.2191 408.579 55.0376C408.579 57.8561 409.378 60.1021 410.976 61.7756C412.619 63.4051 414.605 64.2198 416.934 64.2198C419.262 64.2198 421.226 63.4051 422.824 61.7756C424.467 60.1462 425.289 57.9222 425.289 55.1036Z"
                                    fill="current"
                                />
                            </svg>
                        </a>
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
                    <span className="absolute bottom-0 text-lg mb-8">&copy; 2022 All Rights Reserved</span>
                </div>
            </div>
        </>
    )
}

export default App
