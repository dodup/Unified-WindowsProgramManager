("use strict");
var ConnectRuntime = require("./Bindings/njs/opn.js"); /*import Comfort api*/
const {
  exec,
} = require("child_process"); /* Node Js Module to open external programs */

const net = require("net"); // For OpenPipe (Unified)
const readline = require("readline"); // For OpenPipe (Unified)

// Used to collect the tag values needed within the email
var tagsReadCompleted = []; // Array to store read tags received from runtime
var tagsToRead = []; // Array to store to be read tags
tagsToRead.push("_WINPROGMANAGER_.trigger");
tagsToRead.push("_WINPROGMANAGER_.path");

// Default values, it means that if the script is started after runtime, there must be a value change!
let trigger = false;
let path = "";

/* Connect To runtime*/
ConnectRuntime.Connect((runtimeClass) => {
  let runtime = runtimeClass.Runtime;
  runtime.on("NotifySubscribeTag", (tagsList, cookie) => {
    for (let tagobject of tagsList) {
      if (tagobject.Name == "_WINPROGMANAGER_.trigger") {
        if (parseInt(tagobject.Value) === 1) {
          trigger = true;
        } else {
          trigger = false;
        }
        runtime.ReadTag(tagsToRead, "ReadTagCookie");
      }
    }
  });
  runtime.on("NotifyReadTag", (tagsList, cookie) => {
    OpenExternalProgramHandler(tagsList);
  });
  /* Subscribe Tag*/
  runtime.SubscribeTag(["_WINPROGMANAGER_.trigger"], "SubscribeTagCookie");
});

/*Send Email function*/
function OpenExternalProgramHandler(tagsList) {
  /* Since this sample is written with 'SetOption EnableExpertMode' via comfort layer, then response will be always in JSON mode */
  if (tagsList) {
    for (let tagData of tagsList) {
      //Preparing email parameters
      switch (tagData.Name) {
        case "_WINPROGMANAGER_.trigger":
          tagData.Value == "TRUE" ? (trigger = true) : (trigger = false);
          break;
        case "_WINPROGMANAGER_.path":
          path = String.raw`${tagData.Value}`;
          break;
        default:
        //console.log(`No suitable tags found.`);
      }

      tagsReadCompleted.push(tagData.Name);
    }
    /*Check whether all tags read or not, if read send e-mail*/
    if (compare(tagsReadCompleted, tagsToRead)) {
      tagsReadCompleted = [];
      if (trigger) {
        const fs = require("fs");

        const now = new Date();
        const timestamp = now.toLocaleString();

        // Append the log with the timestamp and the message
        fs.appendFileSync(
          "C:\\temp\\UWPM-service-log.txt",
          `[${timestamp}] Trigger received. Path: ${path}\n`
        );

        OpenExternalProgram()
          .then((error) => {
            writeValue("_WINPROGMANAGER_.trigger", "0");
          })
          .catch((error) => {
            //console.log(`Promise failed, error ${error}`);
          });
      }
    }
  }
}

/*Main fonction that opens external program*/
function OpenExternalProgram() {
  return new Promise(function (resolve, reject) {
    // Simulate program launching or real logic
    exec(`${path}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/*Array Compare function*/
function compare(a, b) {
  a.sort();
  b.sort();
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/*Write value back to WinCC Unified*/
function writeValue(tag, value) {
  // Open named pipe connection
  let client = net.connect("\\\\.\\pipe\\HmiRuntime", () => {
    const rl = readline.createInterface({
      input: client,
      crlfDelay: Infinity,
    });

    rl.on("line", function (line) {
      var tokens = line.split(/[\s,]+/);
      var cmd = tokens.shift();
      if ("NotifyWriteTagValue" == cmd) {
        var tagName = tokens.shift();
        //console.log("\ncommand:" + cmd + "\ntagName:" + tagName);
      }
      if ("ErrorWriteTagValue" == cmd) {
        //console.log(line);
      }

      client.end();
    });
    client.on("end", function () {
      //console.log("on end");
    });

    client.write(`WriteTagValue ${tag} ${value}\n`); // Write to tag
  });
}
