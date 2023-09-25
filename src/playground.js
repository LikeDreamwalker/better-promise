class betterPromise {
    constructor(executor) {
      this._isCanceled = false;
      this._isTimeout = false;
      this._isFinished = false;
      this._onCancel = null;
  
      this.promise = new Promise((resolve, reject) => {
        this._resolve = (value) => {
          if (!this._isCanceled && !this._isTimeout) {
            this._isFinished = true;
            resolve(value);
          }
        };
        this._reject = reject;
        executor(
          resolve,
          reject,
          () => this._isCanceled,
          () => this._isTimeout
        );
      });
    }
  
    then(onFulfilled, onRejected) {
      this.promise = this.promise.then(onFulfilled, onRejected);
      return this;
    }
  
    catch(onRejected) {
      this.promise = this.promise.catch(onRejected);
      return this;
    }
  
    finally(onFinally) {
      this.promise = this.promise.finally(onFinally);
      return this;
    }
  
    onCancel(onCancel) {
      // If a callback is provided, add it to an array of cancel callbacks
      if (onCancel !== undefined) {
        if (!this._cancelCallbacks) {
          this._cancelCallbacks = [];
        }
        this._cancelCallbacks.push(onCancel);
      }
  
      return this;
    }
  
    cancel() {
      if (!this._isCanceled && !this._isTimeout && !this._isFinished) {
        this._isCanceled = true;
        const result = { status: "cancel" };
        this._resolve(result);
        if (this._cancelCallbacks) {
          this._cancelCallbacks.forEach((callback) => callback(result));
        }
      }
      return this;
    }
  
    timeout(onTimeout, delay) {
      if (delay !== undefined) {
        // If a delay is provided, clear any existing timeout and set a new one
        if (this._timeoutId) {
          clearTimeout(this._timeoutId);
        }
        this._timeoutId = setTimeout(() => {
          this._isTimeout = true;
          const result = { status: "timeout" };
          this._resolve(result);
          if (this._timeoutCallbacks) {
            this._timeoutCallbacks.forEach((callback) => callback(result));
          }
        }, delay);
      }
  
      // If a callback is provided, add it to an array of timeout callbacks
      if (onTimeout !== undefined) {
        if (!this._timeoutCallbacks) {
          this._timeoutCallbacks = [];
        }
        this._timeoutCallbacks.push(onTimeout);
      }
  
      return this;
    }
  }
  
  // Usage
  const p = new betterPromise((resolve, reject, isCanceled, isTimedout) => {
    console.log(performance.now(), "test cancel init");
    const timerId = setTimeout(() => {
      if (!isCanceled() && !isTimedout()) {
        resolve({ status: "success" });
      }
    }, 2000);
  })
    .then((res) => {
      console.log("success", res);
    })
    .timeout((res) => {
      console.log("timeout", res);
    }, 3000)
    .onCancel((res) => {
      console.log("cancel", res);
    })
    .catch((err) => {
      console.log("fail", err);
    });
  
  // Test cancel
  setTimeout(() => {
    p.cancel();
    console.log(
      performance.now(),
      "promise is canceled by manual cancel function"
    );
  }, 1000);
  
  p.onCancel(() => {
    console.log("What?");
  });
  p.onCancel(() => {
    console.log("What??");
  });
  
  // Test timeout
  let p2Timer = null;
  const p2 = new betterPromise((resolve, reject, isCanceled, isTimedout) => {
    console.log(performance.now(), "test timeout init");
    // If set p2Timer inside the promise, it will always waiting for execution.
    p2Timer = setTimeout(() => {
      if (!isCanceled() && !isTimedout()) {
        resolve({ status: "success" });
      }
    }, 5000);
  })
    .then((res) => {
      console.log("success", res);
    })
    .timeout((res) => {
      console.log("timeout", res);
      console.log(performance.now(), "p2 is canceled by timeout function");
      clearTimeout(p2Timer);
    }, 3000)
    .onCancel((res) => {
      console.log("cancel", res);
    })
    .catch((err) => {
      console.log("fail", err);
    });
  
  p2.timeout(() => {
    console.log("What?");
  });
  p2.timeout(() => {
    console.log("What??");
  });
  p2.timeout(() => {
    console.log("What???");
  });
  
  // const p3 = new betterPromise((resolve, reject, isCanceled, isTimedout) => {
  //   console.log(performance.now(), "test then init");
  //   const timerId = setTimeout(() => {
  //     if (!isCanceled() && !isTimedout()) {
  //       resolve({ status: "success" });
  //     }
  //   }, 2000);
  // })
  //   .then((res) => {
  //     console.log("success", res);
  //     console.log(performance.now(), "P3 success", res);
  //   })
  //   .catch((err) => {
  //     console.log("fail", err);
  //   });
  
  // const p4 = new betterPromise((resolve, reject, isCanceled, isTimedout) => {
  //   console.log(performance.now(), "test catch init");
  //   const timerId = setTimeout(() => {
  //     if (!isCanceled() && !isTimedout()) {
  //       reject({ status: "fail" });
  //     }
  //   }, 2000);
  // })
  //   .then((res) => {
  //     console.log("success", res);
  //   })
  //   .catch((err) => {
  //     console.log("fail", err);
  //     console.log(performance.now(), "P4 fail", err);
  //   });
  
  // const p5 = new betterPromise(
  //   (resolve, reject, isCanceled, isTimedout) => {
  //     const timerId = setTimeout(() => {
  //       if (!isCanceled() && !isTimedout()) {
  //         resolve({ status: "success" });
  //       }
  //     }, 2000);
  //   },
  //   {
  //     unique: true,
  //   }
  // );
  
  export function promiseWrapper(
    promise,
    wrapperArray = [timeout, unique, cancelable]
  ) {
    // codes here
    return timeout(unique(cancelable(promise)));
  }
  