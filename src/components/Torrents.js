import React, {useState, useContext, useEffect} from 'react';
import {Button} from 'react-onsenui'; // Only import the necessary components
import {sync, login} from '../utils/TorrClient';
import TorrentBox from './TorrentBox';
import {Context} from "../App"
import {saveStorage} from '../utils/Storage';
import LogoHeader from "./LogoHeader";
import useInterval from "../utils/useInterval";

const Torrents = (props) => {
    const {settings, updateSettings} = useContext(Context);

    const [feedback, setFeedback] = useState(null)
    const [username, setUsername] = useState(undefined)
    const [password, setPassword] = useState(undefined)

    const [torrentList, setTorrentList] = useState([])
    const [torrentData, setTorrentData] = useState({})
    const [initialLoad,setInitialLoad] = useState(false)


    const [RID, setRID] = useState(0)

    useInterval(() => {
        if (settings.loggedin) {
            sync(RID).then(resp => {
                const {data} = resp

                if (data.full_update) {
                    setTorrentData(data.torrents);
                    setTorrentList(Object.keys(data.torrents));
                } else {

                    if (data.torrents) {
                        let updatedObj = torrentData;

                        const keysArray = Object.keys(data.torrents);

                        keysArray.forEach((hash) => {

                            if (!updatedObj[hash]) {
                                updatedObj[hash] = {};
                            }

                            const properties = Object.keys(data.torrents[hash]);

                            properties.forEach((property) => {
                                updatedObj[hash][property] = data.torrents[hash][property]
                            })

                            if(!torrentList.includes(hash)){
                                setTorrentList([...torrentList,hash])
                            }
                        })

                        setTorrentData(updatedObj);
                    }

                }

                setRID(RID + 1)

                if(RID === 0){
                    setInitialLoad(true)
                }
            });
        }
    }, 1000)

    const handleSignin = () => {

        login({username, password}).then(response => {

            if (response.data === "Ok.") {

                const userObject = {
                    username,
                    password,
                    loggedin: true,
                };

                saveStorage("user", userObject).then(() => {
                    updateSettings(userObject)
                })

            } else {
                setFeedback("Login Unauthorized.")
            }

        }).catch(() => {
            setFeedback("Too many login attempts. This IP is temporarily blocked. You can restart qBitTorrent to reset this.")
        })
    }

    const LoginForm = () => {
        return (
            <div className={"torrentBox login"}>
                <LogoHeader/>
                <h2 className="centered">Welcome To Your WebUI</h2>
                <div className="inputGroup">
                    <label htmlFor="username-input">
                        <span>Username</span>
                        <input
                            id="username-input"
                            type="text"
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Username"
                            autoCapitalize={"none"}
                            autoCorrect={"none"}
                            autoComplete={"none"}
                        />
                    </label>
                    <label htmlFor="password-input">
                        <span>Password</span>
                        <input
                            id="password-input"
                            type="password"
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Password"/>
                    </label>
                </div>
                {feedback ? <p className="feedback">{feedback}</p> : null}
                <Button modifier="large--quiet" onClick={() => handleSignin()}>
                    Sign In
                </Button>
            </div>
        )
    }

    const removeFromFeed = (hash) => {
        const hashIndex = torrentList.indexOf(hash);
        const listToUpdate = torrentList;
        listToUpdate.splice(hashIndex,1);
        setTorrentList(listToUpdate);
    }

    return (
        <>

            {
                settings.loggedin ?
                    torrentList.map((hash) =>
                        <TorrentBox
                            item={torrentData[hash]}
                            fullData={torrentData}
                            key={hash}
                            hash={hash}
                            filter={props.segment}
                            removeFromFeed={(hash)=>{removeFromFeed(hash)}}
                        />)
                    : null
            }

            {settings.loggedin ? null : LoginForm()}

        </>

    )
}

export default Torrents
