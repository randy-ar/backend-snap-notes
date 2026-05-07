import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../../common/supabase/supabase.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token autentikasi tidak ditemukan');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Format token tidak valid');
    }

    try {
      const client = this.supabaseService.getClient();
      const { data: { user }, error } = await client.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Token tidak valid atau sudah expired');
      }

      request.user = {
        id: user.id,
        email: user.email || '',
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Gagal memverifikasi token');
    }
  }
}
