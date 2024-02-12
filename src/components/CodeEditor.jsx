import React, { useState, useEffect, useRef } from "react";
import { useChannel } from "ably/react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Button, space } from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  Flex,
} from "@chakra-ui/react";
import { useToast, ToastProvider } from '@chakra-ui/react';
import OpenAI from "openai";
import Spaces from "@ably/spaces";
import { Realtime } from "ably";
import "./CodeEditor.css";
import soundFile from "../audio/success.mp3";
import VideoCall from "./VideoCall";

const extensions = [javascript({ jsx: true })];

const CodeEditor = () => {
  const { id } = useParams();
  const toast = useToast();
  const [codeDetails, setCodeDetails] = useState({});
  const [show, setShow] = useState(false);
  const [credits, setCredits] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [testCases, setTestCases] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAIResponse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [userSet, setUserSet] = useState(new Set());
  const [userAvatars, setUserAvatars] = useState({});
  const [participants, setParticipants] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [roomID, setRoomID] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [showSpaceItems, setShowSpaceItems] = useState(
    localStorage.getItem("session") &&
      localStorage.getItem("session") === "true"
      ? true
      : false
  );
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const currentLineRef = useRef(currentLine);
  const { channel, ably } = useChannel("chat-message", (message) => {
    const isMyMessage = message.connectionId === ably.connection.id;
    if (!isMyMessage) {
      if(message.data != "video-request"){
        setCode(message.data);
      }
    }
  });

  useEffect(() => {
    allSpaceStuff();
  }, []);

  useEffect(() => {
    if (showPopover) {
      toast({
        title: 'Alert!',
        description: 'Your peer is requesting for a video call',
        status: 'warning',
        duration: 3000, 
        isClosable: true,
      });

      setShowPopover(false);
    }
  }, [showPopover, toast]);

  function renderCursor(participant) {
    let cursor = document.getElementById(participant.name);
    if (!cursor) {
      cursor = document.createElement("div");
      cursor.id = participant.name;
      cursor.style.width = "auto";
      cursor.style.height = "auto";
      cursor.style.borderRadius = "5px";
      cursor.style.padding = "5px";
      cursor.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
      cursor.style.color = "#fff";
      cursor.style.fontFamily = "Arial, sans-serif";
      cursor.style.position = "absolute";
      document.body.appendChild(cursor);
    }

    cursor.innerHTML = participant.name;
    cursor.style.left = `${participant.x}px`;
    cursor.style.top = `${participant.y}px`;
  }

  let previousTargetLine = null;

  function updateLineMarker(participant) {
    const targetLineNumber = participant.location;
    const lineElements = document.getElementsByClassName("cm-line");
    let adjustedLineNumber;
    if (targetLineNumber == 0 || targetLineNumber == 1) {
      adjustedLineNumber = 1;
    } else {
      adjustedLineNumber = targetLineNumber;
    }
    while (adjustedLineNumber >= lineElements.length) {
      const newLineElement = document.createElement("div");
      newLineElement.className = "cm-line";
      document.body.appendChild(newLineElement);
    }

    if (adjustedLineNumber >= 0 && adjustedLineNumber < lineElements.length) {
      if (previousTargetLine !== null) {
        previousTargetLine.style.backgroundColor = "";
      }

      const targetLine = lineElements[adjustedLineNumber];
      if (targetLine) {
        targetLine.style.backgroundColor = "green";
        previousTargetLine = targetLine;
      }
    }
  }

  function lockLine(participant) {
    const targetLineNumber = participant.location;
    const lineElements = document.getElementsByClassName("cm-line");
    let adjustedLineNumber;
    if (targetLineNumber == 0 || targetLineNumber == 1) {
      adjustedLineNumber = 1;
    } else {
      adjustedLineNumber = targetLineNumber;
    }
    while (adjustedLineNumber >= lineElements.length) {
      const newLineElement = document.createElement("div");
      newLineElement.className = "cm-line";
      document.body.appendChild(newLineElement);
    }

    if (adjustedLineNumber >= 0 && adjustedLineNumber < lineElements.length) {
      if (previousTargetLine !== null) {
        previousTargetLine.style.backgroundColor = "";
      }

      const targetLine = lineElements[adjustedLineNumber];
      if (targetLine) {
        targetLine.style.backgroundColor = "green";
        targetLine.style.cursor = "not-allowed";
        previousTargetLine = targetLine;
      }
    }
  }

  useEffect(() => {
    participants
      .filter((participant) => participant.name !== localName)
      .forEach((participant) => {
        updateLineMarker(participant);
        renderCursor(participant);
        lockLine(participant);
        //add a function for showing locks in UI
      });
    // console.log(participants);
  }, [participants]);

  useEffect(() => {
    if (localStorage.getItem("session") === "false") {
      setShowSpaceItems(false);
    }
  }, [localStorage.getItem("session")]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/code/${id}`)
      .then((response) => {
        setCodeDetails(response.data);
        setCode(response.data.function);
      })
      .catch((error) => {
        console.error("Error fetching code details:", error);
      });
  }, [id]);

  const localName = localStorage.getItem("name");
  const handleChange = (newCode) => {
    setCode(newCode);
    channel.publish({ name: "chat-message", data: newCode });
    const lines = newCode.split("\n");
    let cursorPosition = code
      .split("\n")
      .slice(0, lines.length - 1)
      .join("\n").length;
    let line = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1;
      if (cursorPosition < lineLength) {
        line = i;
        break;
      }
      cursorPosition -= lineLength;
    }
    currentLineRef.current = line + 1;
  };

  const playSound = () => {
    const audio = new Audio(soundFile);
    audio.play();
  };

  const getOutput = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/execute`,
        {
          code: code,
          codeId: id,
          email: localStorage.getItem("email"),
        }
      );
      setTestCases(response.data.testResults);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getSolution = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/managecreds`,
        {
          email: localStorage.getItem("email"),
        }
      );

      if (res.data.success) {
        setCredits(true);
        setShow(true);
      } else {
        setCredits(false);
        setShow(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const registerSpace = async () => {
    try {
      const uuid = generateRandomUUID();
      const currentURL = new URL(window.location.href);
      const codeID = id;
      const username = localStorage.getItem("name");
      const profileURL = localStorage.getItem("picture");
      localStorage.setItem("session", true);

      // Make a POST request to the backend
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/registerspace`,
        {
          codeID,
          spaceID: uuid,
          username,
          profileURL,
        }
      );

      console.log("Space registered successfully:", response.data);

      // Redirect to the updated URL with the space ID
      currentURL.searchParams.set("space", uuid);
      const updatedURL = currentURL.toString();
      window.location.href = updatedURL;
    } catch (error) {
      // Handle any errors, e.g., display an error message or perform error handling
      console.error("Error registering space:", error);
    } finally {
      console.log(showSpaceItems, "showSpaceItems");
    }
  };

  const terminateSession = async () => {
    localStorage.setItem("session", false);
    setShowSpaceItems(false);

    const currentURL = new URL(window.location.href);
    const spaceId = currentURL.searchParams.get("space");

    if (spaceId) {
      try {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/deletespace`, {
          spaceID: spaceId,
          codeID: id,
        });

        currentURL.searchParams.delete("space");
        const updatedURL = currentURL.toString();
        window.location.href = updatedURL;
      } catch (error) {
        console.error("Error deleting space:", error);
      }
    } else {
      currentURL.searchParams.delete("space");
      const updatedURL = currentURL.toString();
      window.location.href = updatedURL;
    }
  };

  // Function to generate a random UUID
  function generateRandomUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  const handlePayment = async () => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      key_secret: process.env.REACT_APP_RAZORPAY_KEY_SECRET,
      amount: 100 * 100,
      currency: "INR",
      name: "CodeAbly",
      description: "Credits",
      handler: function (response) {
        console.log(response);
        alert("payment done");
      },
      prefill: {
        name: "CodeAbly",
        email: "payment@CodeAbly.com",
        contact: "7878787832",
      },
      notes: {
        address: "CodeAbly Corporate office",
      },
      theme: {
        color: "#F37254",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

    //now credit 100 to user
    setTimeout(async () => {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/addcredits`,
        {
          email: localStorage.getItem("email"),
        }
      );

      if (res.data.success) {
        setCredits(true);
      } else {
        setCredits(false);
      }
    }, 12000);
  };

  const getAIHelp = async () => {
    setLoadingAI(true);
    setShowModal(true);
    try {
      const openai = new OpenAI({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Explain the code for ${codeDetails.question} in python.`,
          },
        ],
        model: "gpt-3.5-turbo",
      });
      setAIResponse(chatCompletion.choices[0].message.content);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const currentURL = window.location.href;
  const url = new URL(currentURL);
  const spaceName = url.searchParams.get("space");

  const allSpaceStuff = async () => {
    if (spaceName) {
      const localStorageName = localStorage.getItem("name");
      if (!localStorageName) {
        const userName = prompt("Please enter your name:");
        if (userName) {
          localStorage.setItem("name", userName);
          localStorage.setItem(
            "picture",
            `https://www.gravatar.com/avatar/${hashEmail(userName)}?d=identicon`
          );
        }
      }
      channel.subscribe("video-request",(message)=>{
        const isMyMessage = message.connectionId === ably.connection.id;
    if (!isMyMessage) {
      setShowPopover(true);
    }
      })
      const requestBody = JSON.stringify({ spaceID: spaceName });
      console.log(spaceName);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/getroomidfromspace`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: requestBody,
          }
        );
        console.log("responseeee", response);
        if (response.ok) {
          const data = await response.json();
          setRoomID(data.roomID);
        } else {
          console.log("room not found");
        }
      } catch (error) {
        console.log(error);
      }

      const client = new Realtime.Promise({
        key: process.env.REACT_APP_ABLY_KEY,
        clientId: process.env.REACT_APP_ABLY_CLIENDID,
      });

      const spaces = new Spaces(client);
      const space = await spaces.get(spaceName, {
        offlineTimeout: 180_000,
      });

      await space.enter({
        name: localStorage.getItem("name"),
        avatar: localStorage.getItem("picture"),
      });

      const allMembers = await space.members.getAll();
      allMembers.forEach((member) => {
        const { profileData, connectionId } = member;
        if (profileData && profileData.name) {
          if (!userSet.has(profileData.name)) {
            setParticipants((prevParticipants) => {
              if (
                !prevParticipants.some(
                  (participant) => participant.name === profileData.name
                )
              ) {
                return [
                  ...prevParticipants,
                  {
                    name: profileData.name,
                    connectionId: connectionId,
                    avatar: profileData.avatar,
                    x: null,
                    y: null,
                    location: null,
                    lock: null,
                  },
                ];
              }
              return prevParticipants;
            });
            setUserSet(
              (prevUserSet) => new Set([...prevUserSet, profileData.name])
            );
            setUserAvatars((prevUserAvatars) => ({
              ...prevUserAvatars,
              [profileData.name]: profileData.avatar,
            }));
          }
        }
      });

      space.members.subscribe("enter", async (memberUpdate) => {
        const { profileData, connectionId } = memberUpdate;
        if (profileData && profileData.name) {
          if (!userSet.has(profileData.name)) {
            playSound();
            setParticipants((prevParticipants) => {
              if (
                !prevParticipants.some(
                  (participant) => participant.name === profileData.name
                )
              ) {
                return [
                  ...prevParticipants,
                  {
                    name: profileData.name,
                    connectionId: connectionId,
                    avatar: profileData.avatar,
                    x: null,
                    y: null,
                    location: null,
                    lock: null,
                  },
                ];
              }
              return prevParticipants; // No need to insert if the name already exists
            });

            setUserSet(
              (prevUserSet) => new Set([...prevUserSet, profileData.name])
            );
            setUserAvatars((prevUserAvatars) => ({
              ...prevUserAvatars,
              [profileData.name]: profileData.avatar,
            }));
          }
        }
      });

      space.members.subscribe("leave", (memberUpdate) => {
        const { profileData, connectionId } = memberUpdate;
        if (profileData && profileData.name) {
          setParticipants((prevParticipants) =>
            prevParticipants.filter(
              (participant) => participant.connectionId !== connectionId
            )
          );
          setUserSet((prevUserSet) => {
            const newUserSet = new Set(prevUserSet);
            newUserSet.delete(profileData.name);
            return newUserSet;
          });
          setUserAvatars((prevUserAvatars) => {
            const newUserAvatars = { ...prevUserAvatars };
            delete newUserAvatars[profileData.name];
            return newUserAvatars;
          });
        }
      });

      //let lastUpdateTime = 0;

      window.addEventListener("mousemove", (event) => {
        const { clientX, clientY } = event;
        // const currentTime = Date.now();

        // if (currentTime - lastUpdateTime >= 10) {
        space.cursors.set({
          position: { x: clientX, y: clientY },
          data: { color: "red" },
        });

        //lastUpdateTime = currentTime;
        // }
      });

      space.cursors.subscribe("update", async (cursorUpdate) => {
        const { connectionId, data, position } = cursorUpdate;

        setParticipants((prevParticipants) => {
          const existingParticipantIndex = prevParticipants.findIndex(
            (participant) => participant.connectionId === connectionId
          );

          if (existingParticipantIndex !== -1) {
            const updatedParticipants = [...prevParticipants];
            const existingParticipant =
              updatedParticipants[existingParticipantIndex];

            if (
              typeof position.x === "number" &&
              typeof position.y === "number" &&
              existingParticipant.connectionId === connectionId
            ) {
              existingParticipant.x = position.x;
              existingParticipant.y = position.y;
            }

            if (data) {
              existingParticipant.name = data.name || existingParticipant.name;
              existingParticipant.avatar =
                data.avatar || existingParticipant.avatar;
            }

            return updatedParticipants;
          }

          return prevParticipants;
        });
      });

      const editorId = "my-code-mirror";
      const editorElement = document.querySelector("#" + editorId);

      editorElement.addEventListener("input", async function (event) {
        console.log(currentLineRef.current);
        space.locations.set({ slide: currentLineRef.current });
        if (space.locks.get(currentLineRef.current)) {
          console.log("already locked");
        } else {
          await space.locks.release(currentLineRef.current - 1);
          await space.locks.acquire(currentLineRef.current);
        }
        console.log("hiii from lock");
      });

      space.locations.subscribe(
        "update",
        ({ member, currentLocation, previousLocation }) => {
          const { connectionId, profileData, location } = member;

          setParticipants((prevParticipants) => {
            const existingParticipantIndex = prevParticipants.findIndex(
              (participant) => participant.name === profileData.name
            );

            if (existingParticipantIndex !== -1) {
              const updatedParticipants = [...prevParticipants];
              const existingParticipant =
                updatedParticipants[existingParticipantIndex];

              existingParticipant.location = location.slide;

              if (profileData) {
                existingParticipant.name = profileData.name || profileData.name;
                existingParticipant.avatar =
                  profileData.avatar || existingParticipant.avatar;
              }

              return updatedParticipants;
            }

            return prevParticipants;
          });
        }
      );

      space.locks.subscribe("update", (lock) => {
        const { id, status, member } = lock;
        if (status == "locked") {
          setParticipants((prevParticipants) => {
            const existingParticipantIndex = prevParticipants.findIndex(
              (participant) => participant.name === member.profileData.name
            );

            if (existingParticipantIndex !== -1) {
              const updatedParticipants = [...prevParticipants];
              const existingParticipant =
                updatedParticipants[existingParticipantIndex];
              existingParticipant.lock = id;

              return updatedParticipants;
            }
            return prevParticipants;
          });
        }
      });
    } else {
      console.log("No 'space' parameter found in the URL.");
    }
  };

  function hashEmail(email) {
    const md5 = require("md5");
    return md5(email.trim().toLowerCase());
  }

  return (
    <Box m={6}>
      <Flex>
        {Array.from(userSet).map((userName, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div className="avatar-container">
              <img
                src={
                  userAvatars[userName] ||
                  `https://www.gravatar.com/avatar/${hashEmail(
                    userName
                  )}?d=identicon`
                }
                alt={`${userName}'s avatar`}
                className="avatar-image"
              />
              <span className="username">{userName}</span>
            </div>
          </div>
        ))}
      </Flex>
      {spaceName ? (
        <div style={{ position: "absolute", bottom: 5, right: 5, display: "flex", gap: "5px" }}>
          <VideoCall roomID={roomID} />
          <Button onClick={()=> {
            channel.publish({ name: "video-request", data: "video-request" });
          }}>Request for Video Call</Button>
        </div>
      ) : (
        <></>
      )}
      <Flex>
        {testCases?.map((testCase, i) => (
          <Box
            key={i}
            mr={4}
            color={testCase ? "green" : "red"}
            fontWeight="bold"
          >
            {testCase === true ? "✅ Test Case Passed" : "❌ Test Case Failed"}
          </Box>
        ))}
      </Flex>
      <br></br>
      <div style={{ display: "flex", gap: "30px" }}>
        <CodeMirror
          id="my-code-mirror"
          value={code}
          height="80vh"
          width="80vh"
          theme={okaidia}
          extensions={[javascript({ jsx: true })]}
          onChange={handleChange}
          style={{ fontSize: "16px" }}
          options={{
            gutters: ["participantsCursor"],
            lineNumbers: true,
            rulers: [{ column: 80, color: "red", lineStyle: "dashed" }],
          }}
        />
        <div>
          {codeDetails ? (
            <div>
              <h3 style={{ fontWeight: "bold" }}> {codeDetails.question} </h3>
              <div>{codeDetails.description}</div>
              <br />
              <div
                style={{
                  backgroundColor: "lightgray",
                  padding: "10px",
                  borderRadius: "2px",
                }}
              >
                <div>Inputs: {codeDetails.input}</div>
                <div>Sample Output: {codeDetails.output}</div>
              </div>
              <br />
              <Flex gap={5}>
                <Button
                  onClick={getSolution}
                  _hover={{ bg: "black", color: "white" }}
                  bgColor="white"
                  color="black"
                  border="1px solid black"
                >
                  Get Solution 👩‍💻
                </Button>
                <Button
                  onClick={registerSpace}
                  _hover={{ bg: "black", color: "white" }}
                  bgColor="white"
                  color="black"
                  border="1px solid black"
                >
                  Connect with a peer
                </Button>
                <Button
                  visibility={showSpaceItems ? "visible" : "hidden"}
                  onClick={terminateSession}
                >
                  Terminate session
                </Button>
                <Button
                  visibility={showSpaceItems ? "visible" : "hidden"}
                  onClick={openModal}
                >
                  Share Space Link
                </Button>
                <Modal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  contentLabel="Share Space Link Modal"
                >
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Share Space Link</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <p>Copy the URL below and share it with anyone:</p>
                      <input
                        type="text"
                        value={window.location.href}
                        readOnly
                        onClick={(e) => e.target.select()}
                      />
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        onClick={closeModal}
                        _hover={{ bg: "black", color: "white" }}
                        bgColor="white"
                        color="black"
                        border="1px solid black"
                      >
                        Close
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </Flex>
              <div>
                {show === true && credits === true ? (
                  <pre
                    style={{
                      backgroundColor: "black",
                      color: "white",
                      padding: "10px",
                      borderRadius: "2px",
                      marginTop: "10px",
                    }}
                  >
                    {codeDetails.solution}
                  </pre>
                ) : show ? (
                  <div style={{ padding: "10px", borderRadius: "2px" }}>
                    <p style={{ color: "red", fontWeight: "bold" }}>
                      Oops! Seems like you are out of credits 🥴
                    </p>
                    <Button
                      onClick={handlePayment}
                      size="sm"
                      _hover={{ bg: "green", color: "white" }}
                      colorScheme="red"
                    >
                      Buy Credits
                    </Button>
                  </div>
                ) : null}
              </div>

              <br />
              <Button
                onClick={getAIHelp}
                _hover={{ bg: "black", color: "white" }}
                bgColor="white"
                color="black"
                border="1px solid black"
              >
                Try Our AI ✨
              </Button>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      <br />
      <Button
        onClick={getOutput}
        _hover={{ bg: "black", color: "white" }}
        bgColor="black"
        color="white"
        isLoading={isLoading}
      >
        Evaluate Code
      </Button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Craft with AI ✨</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingAI ? (
              <p>Loading AI response...</p>
            ) : aiResponse ? (
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  padding: "10px",
                  borderRadius: "2px",
                }}
              >
                {aiResponse}
              </pre>
            ) : (
              <p>No AI response available.</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => setShowModal(false)}
              _hover={{ bg: "black", color: "white" }}
              bgColor="white"
              color="black"
              border="1px solid black"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CodeEditor;
