import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  createSession,
  getSession,
  updateSession,
  createAuthorization,
  getAuthorization,
  cancelAuthorization,
  captureOrder,
  getOrder,
  updateOrderLines,
  createRefund,
  getCaptures,
  getRefunds
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('Klarna credentials not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  klarnacompayments config set --username <user> --password <pass>'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('klarnacompayments')
  .description(chalk.bold('Klarna Payments CLI') + ' - Payment processing from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--username <user>', 'Klarna API Username')
  .option('--password <pass>', 'Klarna API Password')
  .option('--region <region>', 'Region (eu, na, oc)', 'eu')
  .action((options) => {
    if (options.username) {
      setConfig('username', options.username);
      printSuccess(`Username set`);
    }
    if (options.password) {
      setConfig('password', options.password);
      printSuccess(`Password set`);
    }
    if (options.region) {
      setConfig('region', options.region);
      printSuccess(`Region set to: ${options.region}`);
    }
    if (!options.username && !options.password && !options.region) {
      printError('No options provided. Use --username, --password, or --region');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const username = getConfig('username');
    const password = getConfig('password');
    const region = getConfig('region');

    console.log(chalk.bold('\nKlarna Payments CLI Configuration\n'));
    console.log('Username: ', username ? chalk.green(username) : chalk.red('not set'));
    console.log('Password: ', password ? chalk.green('*'.repeat(8)) : chalk.red('not set'));
    console.log('Region:   ', region ? chalk.green(region) : chalk.yellow('eu'));
    console.log('');
  });

// ============================================================
// SESSIONS
// ============================================================

const sessionsCmd = program.command('sessions').description('Manage payment sessions');

sessionsCmd
  .command('create')
  .description('Create a payment session')
  .requiredOption('--amount <amount>', 'Order amount in minor units (e.g., 1000 = $10.00)')
  .requiredOption('--lines <json>', 'Order lines as JSON array')
  .option('--country <country>', 'Purchase country', 'US')
  .option('--currency <currency>', 'Purchase currency', 'USD')
  .option('--locale <locale>', 'Locale', 'en-US')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    let orderLines;
    try {
      orderLines = JSON.parse(options.lines);
    } catch {
      printError('Invalid JSON for --lines');
      process.exit(1);
    }

    try {
      const session = await withSpinner('Creating session...', () =>
        createSession({
          purchase_country: options.country,
          purchase_currency: options.currency,
          locale: options.locale,
          order_amount: parseInt(options.amount),
          order_lines: orderLines
        })
      );

      if (options.json) {
        printJson(session);
        return;
      }

      printSuccess(`Session created`);
      console.log('Session ID:     ', chalk.cyan(session.session_id || 'N/A'));
      console.log('Client Token:   ', session.client_token ? chalk.green('Generated') : 'N/A');
      console.log('Payment Methods:', session.payment_method_categories?.length || 0);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

sessionsCmd
  .command('get <session-id>')
  .description('Get session details')
  .option('--json', 'Output as JSON')
  .action(async (sessionId, options) => {
    requireAuth();
    try {
      const session = await withSpinner('Fetching session...', () => getSession(sessionId));

      if (options.json) {
        printJson(session);
        return;
      }

      console.log(chalk.bold('\nSession Details\n'));
      console.log('Session ID:     ', chalk.cyan(session.session_id || sessionId));
      console.log('Order Amount:   ', session.order_amount || 'N/A');
      console.log('Currency:       ', session.purchase_currency || 'N/A');
      console.log('Status:         ', session.status || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

sessionsCmd
  .command('update <session-id>')
  .description('Update session')
  .requiredOption('--amount <amount>', 'Order amount in minor units')
  .requiredOption('--lines <json>', 'Order lines as JSON array')
  .option('--json', 'Output as JSON')
  .action(async (sessionId, options) => {
    requireAuth();
    let orderLines;
    try {
      orderLines = JSON.parse(options.lines);
    } catch {
      printError('Invalid JSON for --lines');
      process.exit(1);
    }

    try {
      const session = await withSpinner('Updating session...', () =>
        updateSession(sessionId, {
          order_amount: parseInt(options.amount),
          order_lines: orderLines
        })
      );

      if (options.json) {
        printJson(session);
        return;
      }

      printSuccess('Session updated');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// AUTHORIZATIONS
// ============================================================

const authCmd = program.command('authorizations').description('Manage payment authorizations');

authCmd
  .command('create <auth-token>')
  .description('Create authorization')
  .requiredOption('--amount <amount>', 'Order amount in minor units')
  .requiredOption('--lines <json>', 'Order lines as JSON array')
  .option('--country <country>', 'Purchase country', 'US')
  .option('--currency <currency>', 'Purchase currency', 'USD')
  .option('--locale <locale>', 'Locale', 'en-US')
  .option('--json', 'Output as JSON')
  .action(async (authToken, options) => {
    requireAuth();
    let orderLines;
    try {
      orderLines = JSON.parse(options.lines);
    } catch {
      printError('Invalid JSON for --lines');
      process.exit(1);
    }

    try {
      const auth = await withSpinner('Creating authorization...', () =>
        createAuthorization(authToken, {
          purchase_country: options.country,
          purchase_currency: options.currency,
          locale: options.locale,
          order_amount: parseInt(options.amount),
          order_lines: orderLines
        })
      );

      if (options.json) {
        printJson(auth);
        return;
      }

      printSuccess('Authorization created');
      console.log('Order ID:   ', chalk.cyan(auth.order_id || 'N/A'));
      console.log('Fraud Risk: ', auth.fraud_status || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

authCmd
  .command('get <auth-token>')
  .description('Get authorization details')
  .option('--json', 'Output as JSON')
  .action(async (authToken, options) => {
    requireAuth();
    try {
      const auth = await withSpinner('Fetching authorization...', () => getAuthorization(authToken));

      if (options.json) {
        printJson(auth);
        return;
      }

      console.log(chalk.bold('\nAuthorization Details\n'));
      console.log('Order ID:         ', chalk.cyan(auth.order_id || authToken));
      console.log('Order Amount:     ', auth.order_amount || 'N/A');
      console.log('Status:           ', auth.status || 'N/A');
      console.log('Captured Amount:  ', auth.captured_amount || 0);
      console.log('Remaining Amount: ', auth.remaining_authorized_amount || 0);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

authCmd
  .command('cancel <auth-token>')
  .description('Cancel authorization')
  .option('--json', 'Output as JSON')
  .action(async (authToken, options) => {
    requireAuth();
    try {
      await withSpinner('Cancelling authorization...', () => cancelAuthorization(authToken));

      if (options.json) {
        printJson({ status: 'cancelled' });
        return;
      }

      printSuccess('Authorization cancelled');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// ORDERS
// ============================================================

const ordersCmd = program.command('orders').description('Manage orders');

ordersCmd
  .command('get <order-id>')
  .description('Get order details')
  .option('--json', 'Output as JSON')
  .action(async (orderId, options) => {
    requireAuth();
    try {
      const order = await withSpinner('Fetching order...', () => getOrder(orderId));

      if (options.json) {
        printJson(order);
        return;
      }

      console.log(chalk.bold('\nOrder Details\n'));
      console.log('Order ID:         ', chalk.cyan(order.order_id || orderId));
      console.log('Order Amount:     ', order.order_amount || 'N/A');
      console.log('Currency:         ', order.purchase_currency || 'N/A');
      console.log('Status:           ', order.status || 'N/A');
      console.log('Captured Amount:  ', order.captured_amount || 0);
      console.log('Refunded Amount:  ', order.refunded_amount || 0);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

ordersCmd
  .command('capture <order-id>')
  .description('Capture order amount')
  .requiredOption('--amount <amount>', 'Amount to capture in minor units')
  .option('--description <desc>', 'Capture description')
  .option('--json', 'Output as JSON')
  .action(async (orderId, options) => {
    requireAuth();
    try {
      const capture = await withSpinner('Capturing order...', () =>
        captureOrder(orderId, {
          captured_amount: parseInt(options.amount),
          description: options.description
        })
      );

      if (options.json) {
        printJson(capture);
        return;
      }

      printSuccess('Order captured');
      console.log('Capture ID: ', chalk.cyan(capture.capture_id || 'N/A'));
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

ordersCmd
  .command('update <order-id>')
  .description('Update order lines')
  .requiredOption('--amount <amount>', 'Order amount in minor units')
  .requiredOption('--lines <json>', 'Order lines as JSON array')
  .option('--json', 'Output as JSON')
  .action(async (orderId, options) => {
    requireAuth();
    let orderLines;
    try {
      orderLines = JSON.parse(options.lines);
    } catch {
      printError('Invalid JSON for --lines');
      process.exit(1);
    }

    try {
      await withSpinner('Updating order...', () =>
        updateOrderLines(orderId, {
          order_amount: parseInt(options.amount),
          order_lines: orderLines
        })
      );

      if (options.json) {
        printJson({ status: 'updated' });
        return;
      }

      printSuccess('Order updated');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// REFUNDS
// ============================================================

const refundsCmd = program.command('refunds').description('Manage refunds');

refundsCmd
  .command('create <order-id>')
  .description('Create refund')
  .requiredOption('--amount <amount>', 'Amount to refund in minor units')
  .option('--description <desc>', 'Refund description')
  .option('--json', 'Output as JSON')
  .action(async (orderId, options) => {
    requireAuth();
    try {
      const refund = await withSpinner('Creating refund...', () =>
        createRefund(orderId, {
          refunded_amount: parseInt(options.amount),
          description: options.description
        })
      );

      if (options.json) {
        printJson(refund);
        return;
      }

      printSuccess('Refund created');
      console.log('Refund ID: ', chalk.cyan(refund.refund_id || 'N/A'));
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

refundsCmd
  .command('list <order-id>')
  .description('List refunds for order')
  .option('--json', 'Output as JSON')
  .action(async (orderId, options) => {
    requireAuth();
    try {
      const refunds = await withSpinner('Fetching refunds...', () => getRefunds(orderId));

      if (options.json) {
        printJson(refunds);
        return;
      }

      if (!refunds || refunds.length === 0) {
        console.log(chalk.yellow('No refunds found'));
        return;
      }

      console.log(chalk.bold(`\n${refunds.length} Refund(s)\n`));
      refunds.forEach((refund, i) => {
        console.log(`${i + 1}. Refund ID: ${refund.refund_id || 'N/A'}`);
        console.log(`   Amount:    ${refund.refunded_amount || 0}`);
        console.log('');
      });
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
