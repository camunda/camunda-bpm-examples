/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.example.engine;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Logger;

import org.camunda.bpm.engine.impl.interceptor.Command;
import org.camunda.bpm.engine.impl.interceptor.CommandInterceptor;
import org.camunda.bpm.example.engine.cmd.EndBlockingCmd;
import org.camunda.bpm.example.engine.cmd.StartBlockingCmd;
import org.camunda.bpm.example.engine.cmd.UnblockedCommand;

/**
 * A {@link CommandInterceptor} which throws exceptions if {@link #shouldBlock} is enabled.
 *
 * @author Daniel Meyer
 *
 */
public class BlockingCommandInterceptor extends CommandInterceptor {

  private final static Logger LOG = Logger.getLogger(BlockingCommandInterceptor.class.getName());

  protected AtomicBoolean shouldBlock = new AtomicBoolean();

  public <T> T execute(Command<T> command) {
    // handle start blocking
    if(command instanceof StartBlockingCmd) {
      startBlocking();
      return null;
    }
    // handle end blocking
    if(command instanceof EndBlockingCmd) {
      stopBlocking();
      return null;
    }

    // handle unblocked commands
    if(command instanceof UnblockedCommand) {
      return next.execute(command);
    }
    else {
      // otherwise, check whether we should block this
      if(shouldBlock.get()) {
        throw new BlockedCommandException("Process engine blocked");
      }
      else {
        return next.execute(command);
      }
    }
  }

  public void startBlocking() {
    // start blocking commands.
    shouldBlock.set(true);
    LOG.fine("start blocking commands");
  }

  public void stopBlocking() {
    // stop blocking commands
    shouldBlock.set(false);
    LOG.fine("end blocking commands");
  }

}
