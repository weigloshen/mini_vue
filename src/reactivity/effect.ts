// 依赖收集
// 创建一个 effect ->
import { extend } from "../shared";

// 使用类 构造 对应的依赖对象
class ReactiveEffect {
  private _fn: Function;
  deps = [];
  active = true;
  onStop?: Function;
  constructor(fn: Function, public scheduler?: Function) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
  stop() {
    if (this.active) {
      // 执行 stop ，把 deps 收集的 effect 全部删除， 就无法进行更新，在 运行runner 的时候 ，重新收集 effect
      // cleanupEffect
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}
// Map 结构  [ { key:'', value: '' } ]  key 的设定可以多样性。相对 Obj 有更多的拓展，例如 key : funciton()
// targetMap 用于储存依赖
const targetMap = new Map();

export function track(traget: any, key: any) {
  // 依赖收集 && 触发依赖 函数 用于 后面响应数据，更新数据
  // 先取出 全部的 target，
  // target -> key -> dep
  let depsMap = targetMap.get(traget);

  if (!depsMap) {
    // 初始化的时候需要创建一个大的对象，存储一个组件的依赖 ，存储全部dep，用map
    depsMap = new Map();
    targetMap.set(traget, depsMap);
  }

  let dep: Set<any> = depsMap.get(key);

  if (!dep) {
    // 初始化
    // 不允许有重复的 key值对象，用 set
    dep = new Set();
    depsMap.set(key, dep);
  }
  if (!activeEffect) return;
  dep.add(activeEffect);

  activeEffect.deps.push(dep);
}
export function trigger(traget: any, key: any) {
  let depsMap = targetMap.get(traget);
  let dep = depsMap.get(key);

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
let activeEffect: any;
// 依赖收集
export function effect(fn: Function, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  // Object.assign(_effect,options)
  extend(_effect, options);
  _effect.run();
  // runner 相当于 effect 返回的 _fn ，然后再把 当前_effect 挂载在return 出去
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner: any) {
  runner.effect.stop();
}
